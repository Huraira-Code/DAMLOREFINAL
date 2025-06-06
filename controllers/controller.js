import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import ShootingList from "../models/shootingListModel.js";
import ImageModel from "../models/imageModel.js";
import ShootingSession from "../models/shootingSessionModel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const handleUserSignup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ status: "fail", msg: "All fields are required" });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    if (user) {
      const { _id, email, role } = user;
      const token = jwt.sign({ _id, email, role }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      res.status(201).json({ msg: "successfully Signed Up", token: token });
    }
  } catch (error) {
    res.status(500).json({ msg: "failed", err: error.message });
  }
};

const handleUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "email or password is missing" });
    }

    const user = await User.findOne({
      email,
    });
    console.log(user);

    const { _id, role } = user;

    if (user) {
      const validated = await bcrypt.compare(password, user.password);

      if (validated) {
        const token = jwt.sign({ _id, email, role }, process.env.JWT_SECRET, {
          expiresIn: "30d",
        });

        return res
          .status(200)
          .json({ msg: "successfully Login", token: token });
      } else {
        return res.status(401).json({
          status: "failed",
          msg: "email or password is incorrect",
        });
      }
    } else {
      return res.status(404).json({
        status: "failed",
        msg: "admin not found",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "failed", err: error.message });
  }
};

const handleHomePage = async (req, res) => {
  try {
    res.json({ status: "success", msg: "HomePage" });
  } catch (error) {
    res.json({ status: "failed", msg: error.message });
  }
};

const handleUploadImage = async (req, res) => {
  try {
    const { listId } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ status: "failed", msg: "No images provided" });
    }

    let uploadedImages = [];

    for (const file of files) {
      const cloudinaryResult = await uploadOnCloudinary(file.path);
      if (cloudinaryResult) {
        const imageData = await ImageModel.create({
          imageURL: cloudinaryResult.url,
        });

        await ShootingList.findByIdAndUpdate(
          listId,
          { $push: { imageIDs: imageData._id } },
          { new: true }
        );

        uploadedImages.push(imageData);
      }
    }

    res.json({
      status: "success",
      msg: "Images uploaded successfully",
      data: uploadedImages,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const addNotesToImage = async (req, res) => {
  try {
    const { note } = req.body;
    const { id } = req.params;

    await ImageModel.findByIdAndUpdate(
      id,
      { $push: { notes: note } },
      { new: true }
    );

    res.status(201).json({ status: "success", msg: "Notes Added Succesfully" });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const handleImageDelete = async (req, res) => {
  try {
    const { listId, id } = req.params;

    const deleteResult = await ImageModel.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ status: "failed", msg: "Image not found" });
    }

    await ShootingList.findByIdAndUpdate(
      listId,
      { $pull: { imageIDs: id } },
      { new: true }
    );

    res.json({ status: "Succes", msg: "Successfully Deleted Image" });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const createShootingList = async (req, res) => {
  try {
    const { name, sku, barcode, gender, size, dimension, arrival, sessionId } =
      req.body;
    const newShootingList = new ShootingList({
      name,
      sku,
      barcode,
      gender,
      size,
      dimension,
      arrival,
    });
    console.log(newShootingList);
    const shootingSession = await ShootingSession.findOne({ _id: sessionId });

    if (shootingSession) {
      const shootingList = await ShootingList.create(newShootingList);
      const shootingSession = await ShootingSession.findByIdAndUpdate(
        sessionId,
        { $push: { shootingListIDs: shootingList._id } },
        { new: true }
      );

      res.status(201).json({
        status: "Succes",
        msg: "Successfully Creaated Shooting List",
        shootingList,
      });
    } else {
      return res
        .status(400)
        .json({ status: "failed", msg: "No Shooting Session Found" });
    }
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const getAllShootingList = async (req, res) => {
  try {
    const { id } = req.params;

    const shootinglists = await ShootingSession.findOne({ _id: id }).populate(
      "shootingListIDs"
    );

    res.status(200).json({
      status: "Succes",
      shootinglists,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const deleteShootingList = async (req, res) => {
  try {
    const { id, sessionId } = req.params;

    const deleteResult = await ShootingList.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .json({ status: "failed", msg: "Shooting list not found" });
    }

    await ShootingSession.findByIdAndUpdate(
      sessionId,
      { $pull: { shootingListIDs: id } },
      { new: true }
    );

    res
      .status(200)
      .json({ status: "Succes", msg: "Successfully Deleted Shooting List" });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const createShootingSession = async (req, res) => {
  try {
    const { name, assignedUser } = req.body;

    const shootingList = await ShootingSession.create({ name, assignedUser });

    res.status(201).json({
      status: "Succes",
      msg: "Successfully Creaated Shooting Session",
      shootingList,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const getAllShootingSession = async (req, res) => {
  try {
    const shootingSessions = await ShootingSession.find({}).populate("shootingListIDs");

    res.status(200).json({
      status: "Succes",
      shootingSessions,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const deleteShootingSession = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteResult = await ShootingSession.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .json({ status: "failed", msg: "Shooting Session not found" });
    }

    res
      .status(200)
      .json({ status: "Succes", msg: "Successfully Deleted Shooting Session" });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const handleSendImage = async (req, res) => {
  try {
    const { id } = req.params;

    const imageData = await ImageModel.findByIdAndUpdate(
      id,
      { status: "Delivered" },
      { new: true }
    );

    res
      .status(200)
      .json({ status: "Succes", msg: "Successfully Sent Image", imageData });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const showShootingSessionsToUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    const shootingSession = await ShootingSession.find({
      assignedUser: verify._id,
    });

    if (!shootingSession) {
      return res
        .status(400)
        .json({ status: "failed", msg: "NO SHOOTING SESSION FOUND" });
    }

    res.status(200).json({ status: "Succes", shootingSession });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const showShootingListsToUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    const { sessionId } = req.params;

    const shootingList = await ShootingSession.findOne({
      assignedUser: verify._id,
      _id: sessionId,
    }).populate("shootingListIDs");

    if (!shootingList) {
      return res
        .status(400)
        .json({ status: "failed", msg: "NO SHOOTING LIST FOUND" });
    }

    res.status(200).json({
      status: "Succes",
      shootingLists: shootingList.shootingListIDs,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const showListImagesToUser = async (req, res) => {
  try {
    const { listId } = req.params;

    const result = await ShootingList.find({
      _id: listId,
    }).populate("imageIDs");

    if (!result) {
      return res.status(400).json({ status: "failed", msg: "NO IMAGE FOUND" });
    }

    const images = result[0].imageIDs;

    const data = [];

    images.forEach((image) => {
      if (image.status === "Delivered") {
        data.push(image);
        image.notes = [];
      }
    });

    res.status(200).json({
      status: "Succes",
      data,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const getAllUsers = async (req, res) => {
  console.log("me here ");
  try {
    const users = await User.find({ role: "user" });

    if (!users) {
      return res.status(400).json({ status: "failed", msg: "NO USER FOUND" });
    }

    res.status(200).json({ status: "Succes", users });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const getAllImagesOfList = async (req, res) => {
  try {
    const { listId } = req.params;

    const list = await ShootingList.findById(listId).populate("imageIDs");

    if (!list) {
      return res
        .status(400)
        .json({ status: "failed", msg: "NO SHOOTING LIST FOUND" });
    }

    res.status(200).json({ status: "success", imagesData: list.imageIDs });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const handleUpdateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, assignedUser } = req.body;

    const shootingSession = await ShootingSession.findByIdAndUpdate(
      sessionId,
      { name, assignedUser },
      { new: true }
    );

    if (!shootingSession) {
      return res
        .status(400)
        .json({ status: "failed", msg: "NO SHOOTING SESSION FOUND" });
    }

    res.status(200).json({ status: "success", shootingSession });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const handleUpdateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { name } = req.body;

    const shootingList = await ShootingList.findByIdAndUpdate(
      listId,
      { name },
      { new: true }
    );

    if (!shootingList) {
      return res
        .status(400)
        .json({ status: "failed", msg: "NO SHOOTING LIST FOUND" });
    }

    res.status(200).json({ status: "success", shootingList });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const handleRejectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    const imageData = await ImageModel.findByIdAndUpdate(
      id,
      {
        $set: { status: "Pending" },
        $push: { comments: { userId: verify._id, content: comment } },
      },
      { new: true }
    );

    res.status(200).json({
      status: "Succes",
      msg: "Your response has successfully sent to Admin",
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

export {
  handleHomePage,
  handleUserSignup,
  handleUserLogin,
  handleUploadImage,
  handleImageDelete,
  createShootingList,
  deleteShootingList,
  createShootingSession,
  deleteShootingSession,
  addNotesToImage,
  handleSendImage,
  getAllShootingSession,
  getAllShootingList,
  showShootingSessionsToUser,
  showShootingListsToUser,
  showListImagesToUser,
  getAllUsers,
  getAllImagesOfList,
  handleUpdateSession,
  handleUpdateList,
  handleRejectImage,
};
