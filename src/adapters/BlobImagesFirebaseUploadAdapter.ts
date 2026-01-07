import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { storageApp } from "../utils/firebaseConfig";

export class BlobImagesFirebaseUploadAdapter {
    upload(req: any, folderID: string) {
        return new Promise((resolve, reject) => {
            const storage = getStorage(storageApp);
            const filePath = "uploads/" + folderID + "/" + req.name;
            uploadBytes(
                ref(storage, filePath),
                req
            )
                .then((snapshot) => {
                    return getDownloadURL(snapshot.ref);
                })
                .then((downloadURL) => {
                    resolve({
                        downloadURL,
                    });
                }).catch((error) => {
                    reject(error.message);
                })
        })
    }
}