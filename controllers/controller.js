import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import ShootingList from "../models/shootingListModel.js";
import ImageModel from "../models/imageModel.js";
import ShootingSession from "../models/shootingSessionModel.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import saveImageVersion from "../services/imageVersion.service.js";
import ImageVersion from "../models/imageVersionModel.js";
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
  console.log("Login attempt", req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "email or password is missing" });
    }
    console.log("after email and password check");
    const user = await User.findOne({
      email,
    });
    console.log(user);

    const { _id, role } = user;

    if (user) {
      console.log("User found:", user);
      const validated = await bcrypt.compare(password, user.password);

      if (validated) {
        const token = jwt.sign({ _id, email, role }, process.env.JWT_SECRET, {
          expiresIn: "30d",
        });

        return res
          .status(200)
          .json({ msg: "successfully Login", token: token, role: role });
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
    const { sessionId } = req.body;
    console.log(sessionId);
    const files = req.files;
    console.log("Files received:", files);
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ status: "failed", msg: "No images provided" });
    }

    let uploadedImages = [];

    for (const file of files) {
      // Check if an image with this SKU already exists in the session
      const session = await ShootingSession.findById(sessionId).populate(
        "imageIDs"
      );
      const existingImage = session.imageIDs.find(
        (img) => img.sku === file.originalname
      );

      if (existingImage) {
        // If image exists, call addImageVersion
        console.log(
          `Image with SKU ${file.originalname} exists, adding version`
        );

        // We need to mock the req object for addImageVersion
        try {
          const updatedImage = await addImageVersionLogic({
            sessionId,
            imageId: existingImage._id,
            file,
            reason: "New version uploaded",
            user: req.user,
          });

          uploadedImages.push(updatedImage);
        } catch (versionError) {
          console.error("Error adding image version:", versionError.message);
          // Optional: continue to next file or break
        }
      } else {
        // Original logic for new images
        const cloudinaryResult = await uploadOnCloudinary(file.path);
        if (cloudinaryResult) {
          const imageData = await ImageModel.create({
            imageURL: cloudinaryResult.url,
            sku: file.originalname,
            barcode: req.body.barcode,
            gender: req.body.gender,
            assetypes: req.body.assetypes,
            merchandisingclass: req.body.merchandisingclass,
            arrival: req.body.arrival,
          });

          await ShootingSession.findByIdAndUpdate(
            sessionId,
            { $push: { imageIDs: imageData._id } },
            { new: true }
          );
          uploadedImages.push(imageData);
        }
      }
    }

    res.json({
      status: "success",
      msg: "Images processed successfully",
      data: uploadedImages,
    });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const addImageVersionLogic = async ({
  sessionId,
  imageId,
  file,
  reason,
  user,
}) => {
  if (!file) throw new Error("No image provided");

  const cloudinaryResult = await uploadOnCloudinary(file.path);
  if (!cloudinaryResult) throw new Error("Cloudinary upload failed");

  const currentImage = await ImageModel.findById(imageId).lean();
  if (!currentImage) throw new Error("Image not found");

  const existingVersion = await ImageVersion.findOne({
    imageId,
    "data.imageURL": currentImage.imageURL,
  });

  if (!existingVersion) {
    const versionCount = await ImageVersion.countDocuments({ imageId });
    const versionDoc = await ImageVersion.create({
      imageId,
      versionNumber: versionCount + 1,
      data: currentImage,
      changedBy: user?._id || null,
      reason: reason || "Image updated",
    });

    const updatedImage = await ImageModel.findByIdAndUpdate(
      imageId,
      {
        imageURL: cloudinaryResult.url,
        $push: { versionHistory: versionDoc._id },
      },
      { new: true }
    );

    return updatedImage;
  } else {
    const updatedImage = await ImageModel.findByIdAndUpdate(
      imageId,
      { imageURL: cloudinaryResult.url },
      { new: true }
    );

    return updatedImage;
  }
};

const addImageVersion = async (req, res) => {
  console.log("mera huraira siggh");
  try {
    const { sessionId, imageId } = req.body;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ status: "failed", msg: "No image provided" });
    }
    console.log("hurara", req.file);
    // 1. Upload new image to Cloudinary
    const cloudinaryResult = await uploadOnCloudinary(file.path);
    if (!cloudinaryResult) {
      return res
        .status(500)
        .json({ status: "failed", msg: "Cloudinary upload failed" });
    }

    // 2. Find current image
    const currentImage = await ImageModel.findById(imageId).lean();
    if (!currentImage) {
      return res.status(404).json({ status: "failed", msg: "Image not found" });
    }

    // 3. Check if the current image URL is already in any version
    const existingVersion = await ImageVersion.findOne({
      imageId,
      "data.imageURL": currentImage.imageURL,
    });

    if (!existingVersion) {
      // 4. Only create version if current imageURL is new (not already versioned)
      const versionCount = await ImageVersion.countDocuments({ imageId });
      const versionDoc = await ImageVersion.create({
        imageId,
        versionNumber: versionCount + 1,
        data: currentImage,
        changedBy: req.user?._id || null,
        reason: req.body.reason || "Image updated",
      });

      // 5. Update image and push version
      const updatedImage = await ImageModel.findByIdAndUpdate(
        imageId,
        {
          imageURL: cloudinaryResult.url,
          $push: { versionHistory: versionDoc._id },
        },
        { new: true }
      );

      return res.json({
        status: "success",
        msg: "Image updated and version created",
        data: updatedImage,
      });
    } else {
      // If already versioned, just update imageURL (no need to create duplicate version)
      const updatedImage = await ImageModel.findByIdAndUpdate(
        imageId,
        {
          imageURL: cloudinaryResult.url,
        },
        { new: true }
      );

      return res.json({
        status: "success",
        msg: "Image updated without creating duplicate version",
        data: updatedImage,
      });
    }
  } catch (error) {
    console.error(error);
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

    res.status(200).json({ status: "success", msg: "Notes Added Succesfully" });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

const handleImageDelete = async (req, res) => {
  console.log("Deleting image", req.params);
  try {
    const { sessionId, id } = req.params;

    const deleteResult = await ImageModel.deleteOne({ _id: id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ status: "failed", msg: "Image not found" });
    }

    await ShootingSession.findByIdAndUpdate(
      sessionId,
      { $pull: { imageIDs: id } },
      { new: true }
    );

    res.json({ status: "Succes", msg: "Successfully Deleted Image" });
  } catch (error) {
    res.status(500).json({ status: "failed", msg: error.message });
  }
};

// const createShootingList = async (req, res) => {
//   try {
//     const {
//       name,
//       sku,
//       barcode,
//       gender,
//       merchandisingclass,
//       assetypes,
//       arrival,
//       sessionId,
//     } = req.body;
//     console.log(req.body);
//     const newShootingList = new ShootingList({
//       name,
//       sku,
//       barcode,
//       gender,
//       merchandisingclass,
//       assetypes,
//       arrival,
//     });
//     console.log(newShootingList);
//     const shootingSession = await ShootingSession.findOne({ _id: sessionId });

//     if (shootingSession) {
//       const shootingList = await ShootingList.create(newShootingList);
//       const shootingSession = await ShootingSession.findByIdAndUpdate(
//         sessionId,
//         { $push: { shootingListIDs: shootingList._id } },
//         { new: true }
//       );

//       res.status(201).json({
//         status: "Succes",
//         msg: "Successfully Creaated Shooting List",
//         shootingList,
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ status: "failed", msg: "No Shooting Session Found" });
//     }
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

// const getAllShootingList = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const shootinglists = await ShootingSession.findOne({ _id: id }).populate(
//       "shootingListIDs"
//     );

//     res.status(200).json({
//       status: "Succes",
//       shootinglists,
//     });
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

// const deleteShootingList = async (req, res) => {
//   try {
//     const { id, sessionId } = req.params;

//     const deleteResult = await ShootingList.deleteOne({ _id: id });

//     if (deleteResult.deletedCount === 0) {
//       return res
//         .status(404)
//         .json({ status: "failed", msg: "Shooting list not found" });
//     }

//     await ShootingSession.findByIdAndUpdate(
//       sessionId,
//       { $pull: { shootingListIDs: id } },
//       { new: true }
//     );

//     res
//       .status(200)
//       .json({ status: "Succes", msg: "Successfully Deleted Shooting List" });
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

const createShootingSession = async (req, res) => {
  try {
    const {
      name,
      assignedUser,
      barcode,
      gender,
      merchandisingclass,
      assetypes,
      arrival,
    } = req.body;
    console.log(req.body);
    const shootingList = await ShootingSession.create({
      name,
      assignedUser,
      barcode,
      gender,
      merchandisingclass,
      assetypes,
      arrival,
    });

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
  console.log("Fetching all shooting sessions");
  // Fetch all shooting sessions and populate the shootingListIDs field with imageIDs
  try {
    const shootingSessions = await ShootingSession.find({}).populate({
      path: "imageIDs",
      populate: {
        path: "versionHistory", // Nested population inside imageIDs
        model: "imageVersion",
      },
    });

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

// Recommended change for your backend controller
const handleSendImage = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL parameters
    const { status } = req.body; // Get status from request body

    const imageData = await ImageModel.findByIdAndUpdate(
      id, // Use the ID from the URL
      { status: status }, // Update with the status from the body
      { new: true }
    );

    res
      .status(200)
      .json({ status: "Success", msg: "Successfully Sent Image", imageData });
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
    }).populate({
      path: "imageIDs",
      populate: {
        path: "versionHistory", // Nested population inside imageIDs
        model: "imageVersion",
      },
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

// const showShootingListsToUser = async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;
//     const token = authHeader.split(" ")[1];
//     const verify = jwt.verify(token, process.env.JWT_SECRET);

//     const { sessionId } = req.params;

//     const shootingList = await ShootingSession.findOne({
//       assignedUser: verify._id,
//       _id: sessionId,
//     }).populate("shootingListIDs");

//     if (!shootingList) {
//       return res
//         .status(400)
//         .json({ status: "failed", msg: "NO SHOOTING LIST FOUND" });
//     }

//     res.status(200).json({
//       status: "Succes",
//       shootingLists: shootingList.shootingListIDs,
//     });
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

// const showListImagesToUser = async (req, res) => {
//   try {
//     const { listId } = req.params;

//     const result = await ShootingList.find({
//       _id: listId,
//     }).populate("imageIDs");

//     if (!result) {
//       return res.status(400).json({ status: "failed", msg: "NO IMAGE FOUND" });
//     }

//     const images = result[0].imageIDs;

//     const data = [];

//     images.forEach((image) => {
//       if (image.status === "Delivered") {
//         data.push(image);
//         image.notes = [];
//       }
//     });

//     res.status(200).json({
//       status: "Succes",
//       data,
//     });
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

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

// const getAllImagesOfList = async (req, res) => {
//   try {
//     const { listId } = req.params;

//     const list = await ShootingSession.findById(listId).populate("imageIDs");

//     if (!list) {
//       return res
//         .status(400)
//         .json({ status: "failed", msg: "NO SHOOTING LIST FOUND" });
//     }

//     res.status(200).json({ status: "success", imagesData: list.imageIDs });
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

const updateImageMetadata = async (req, res) => {
  console.log("Updating image metadata", req.body);
  try {
    const { imageId } = req.params;
    const { assetType, merchandisingClass, sku, barcode } = req.body;

    // Optional: Add authorization/authentication logic here if needed
    // e.g., check if the user has permission to update this image

    const updatedImage = await ImageModel.findByIdAndUpdate(
      imageId,
      {
        assetypes: assetType,
        merchandisingclass: merchandisingClass,
        sku,
        barcode,
        // Add any other fields you want to update
      },
      { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators: true` runs schema validators
    );

    if (!updatedImage) {
      return res.status(404).json({ status: "failed", msg: "Image not found" });
    }

    res.status(200).json({
      status: "success",
      msg: "Image metadata updated successfully!",
      imageData: updatedImage,
    });
  } catch (error) {
    console.error("Error updating image metadata:", error);
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

// const handleUpdateList = async (req, res) => {
//   try {
//     const { listId } = req.params;
//     const { name } = req.body;

//     const shootingList = await ShootingList.findByIdAndUpdate(
//       listId,
//       { name },
//       { new: true }
//     );

//     if (!shootingList) {
//       return res
//         .status(400)
//         .json({ status: "failed", msg: "NO SHOOTING LIST FOUND" });
//     }

//     res.status(200).json({ status: "success", shootingList });
//   } catch (error) {
//     res.status(500).json({ status: "failed", msg: error.message });
//   }
// };

const handleRejectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    console.log("Rejecting image with ID:", { id, comment });
    // ✅ Verify user from token
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Step 1: Fetch current image document
    const imageDoc = await ImageModel.findById(id);
    if (!imageDoc) {
      return res.status(404).json({ status: "failed", msg: "Image not found" });
    }

    // ✅ Step 2: Attach metadata and save version
    imageDoc._updatedBy = verify._id;
    imageDoc._updateReason = comment;
    await saveImageVersion(imageDoc); // Save snapshot before update

    // ✅ Step 3: Update status to "Pending" and add comment
    const updatedImage = await ImageModel.findByIdAndUpdate(
      id,
      {
        $set: { status: "IN PROGRESS" },
        $push: {
          comments: { userId: verify._id, content: comment },
        },
      },
      { new: true }
    );

    // ✅ Step 4: Respond
    res.status(200).json({
      status: "Success",
      msg: "Image rejected and sent to Admin. Version saved.",
      updatedImage,
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
  // createShootingList,
  // deleteShootingList,
  createShootingSession,
  deleteShootingSession,
  addNotesToImage,
  handleSendImage,
  getAllShootingSession,
  // getAllShootingList,
  showShootingSessionsToUser,
  // showShootingListsToUser,
  // showListImagesToUser,
  getAllUsers,
  // getAllImagesOfList,
  handleUpdateSession,
  // handleUpdateList,
  updateImageMetadata,
  handleRejectImage,
  addImageVersion,
};
