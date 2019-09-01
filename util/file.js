const fs=require('fs');

const deleteFile=(path)=>{
    fs.unlink(path,(error)=>{
        console.log('am in');
        if(error){
            console.log('error')
            throw new Error(error);
        }
    })
}
exports.deleteFile=deleteFile;