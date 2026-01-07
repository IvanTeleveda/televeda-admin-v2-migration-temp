// this is for testing only!
// @TODO - move this to an env variable
// const firebaseConfig = {
//     apiKey: "AIzaSyA8WrNq6G3ODHfvgoqmxFqnidE8EjFvMZQ",
//     authDomain: "televeda-storage-test.firebaseapp.com",
//     projectId: "televeda-storage-test",
//     storageBucket: "televeda-storage-test.appspot.com",
//     messagingSenderId: "166690735791",
//     appId: "1:166690735791:web:0889c4d393314f2646765a"
// };

import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { storageApp } from "../utils/firebaseConfig";

export class ResourceFirebaseUploaderAdapter {

    upload(req: any, folderID: string, customFileName?: string): Promise<{ downloadURL: string } | unknown> {
        return new Promise((resolve, reject) => {
            const storage = getStorage(storageApp);
            const filePath = "uploads/" + folderID + "/" + (customFileName || req.file.name);
            uploadBytes(
                ref(storage, filePath),
                req.file
            ).then(async (snapshot) => {
                return await getDownloadURL(snapshot.ref);
            }).then((downloadURL) => {
                resolve({
                    downloadURL,
                });
            }).catch((error) => {
                reject(error.message);
            })
        })
    }

    delete(folderID: string, fileName: string) {
        const storage = getStorage(storageApp);
        const fileRef = ref(storage, `uploads/${folderID}/${fileName}`);
        return new Promise((resolve, reject) => {
            deleteObject(fileRef).then(() => {
                resolve(true);
            }).catch((error) => {
                reject(error);
            });
        })
    }

}