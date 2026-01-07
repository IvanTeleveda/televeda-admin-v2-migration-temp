import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { storageApp } from "../utils/firebaseConfig";

export class DefaultFirebaseUploaderAdapter {

    req: any;

    constructor(req: any) {
        this.req = req;
    }

    upload() {
        return new Promise((resolve, reject) => {
            let storage = getStorage(storageApp);
            uploadBytes(
                ref(storage, "images/temp/" + this.req.file.name),
                this.req.file
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