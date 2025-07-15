import ImageVersion from "../models/imageVersionModel.js";
import ImageModel from "../models/imageModel.js";

const saveImageVersion = async (imageDoc) => {
  const original = await ImageModel.findById(imageDoc._id).lean();
  const versionCount = await ImageVersion.countDocuments({ imageId: imageDoc._id });

  const newVersion = await ImageVersion.create({
    imageId: imageDoc._id,
    versionNumber: versionCount + 1,
    data: original,
    changedBy: imageDoc._updatedBy || null,
    reason: imageDoc._updateReason || "",
  });

  // Push the version ID to the image's versionHistory array
  await ImageModel.findByIdAndUpdate(imageDoc._id, {
    $push: { versionHistory: newVersion._id },
  });
};


export default saveImageVersion;