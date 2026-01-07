import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storageApp } from "../utils/firebaseConfig";

export class CkEditorFirebaseUploadAdapter {
    
    loader: any;
    setIsUploading?: any; 

    constructor(loader:any, setIsUploading?: any) {
        this.loader = loader;
        this.setIsUploading = setIsUploading; 
    }
    // Starts the upload process.
    upload() {
        return this.loader.file.then(
            (file: any) =>
                new Promise((resolve, reject) => {
                    let storage = getStorage(storageApp);
                    this.setIsUploading(true); 
                    uploadBytes(
                        ref(storage, "images/temp/" + file.name),
                        file
                    )
                        .then((snapshot) => {
                            return getDownloadURL(snapshot.ref);
                        })
                        .then((downloadURL) => {
                            this.setIsUploading(false); 
                            resolve({
                                default: downloadURL,
                            });
                        }).catch((error) => {
                            this.setIsUploading(false); 
                            reject(error.message);
                        })
                })
        );
    }
}