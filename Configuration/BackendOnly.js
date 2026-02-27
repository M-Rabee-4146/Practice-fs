import fsExtra from "fs-extra/esm";
import {execSync} from "child_process";

export const BackendOnly = async (newPath,backendType) => {

    await fsExtra.ensureDir(`${newPath}/Backend`);

    await fsExtra.copy(`./template/server${backendType}`, `${newPath}/Backend`);
console.log("Installing Dependencies.... This might take some Time");
    execSync(`cd ${newPath}/Backend && npm install`, { stdio: 'inherit' });
console.log("Just update the .env FIle and You are Good to go...")
}