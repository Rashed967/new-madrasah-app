
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  version: number;
  // Add other fields if needed
}

/**
 * Uploads a file to Cloudinary using a specific unsigned upload preset.
 * @param file The file to upload.
 * @param cloudName Your Cloudinary cloud name.
 * @param uploadPreset The unsigned upload preset.
 * @returns Promise<string> The secure URL of the uploaded file.
 * @throws Error if upload fails.
 */
export const uploadToCloudinary = async (
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  // Using "raw" for resource_type to ensure PDFs are handled as raw files
  // and the URL directly links to the PDF for viewing/downloading.
  // Cloudinary might also default to "image" or "auto" for PDFs, but "raw" is more specific.
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data: CloudinaryUploadResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        (data as any).error?.message ||
          `Cloudinary upload failed with status ${response.status}`
      );
    }

    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary-তে ফাইল আপলোড করতে সমস্যা হয়েছে: ${error.message}`);
  }
};
