import fsExtra from "fs-extra/esm";
import inquirer from "inquirer";
import { BackendOnly } from "./Configuration/BackendOnly.js";
import {execSync} from "child_process";

const practice = async () => {
    try {
        console.log("STARTING  the Process");

        const answer = await inquirer.prompt([{
            type: 'input',
            name: 'ProjectName',
            message: 'Write the Name of main Folder'

        }, {
            type: 'rawlist',
            name: 'FrontendBackend',
            message: 'What you want to create ?',
            choices: [
                'Frontend', 'Backend', 'Both'
            ]
        }, {
            type: 'rawlist',
            name: 'BackendType',
            message: 'Which Backend Template you want to use?',
            choices: [
                'MongoDB', 'Sqlite'
            ],
            when: (answers) => answers.FrontendBackend !== 'Frontend' 
        }
        ]);

        const newPath = `./output/${answer.ProjectName}`;

        await fsExtra.ensureDir(newPath);
        // await fsExtra.copy('./template/dbTemp.js', `${newPath}/New.js`);


        if (answer.FrontendBackend == 'Both') {
            await fsExtra.ensureDir(`${newPath}/Frontend`);
            BackendOnly(newPath,answer.BackendType);

        } else if (answer.FrontendBackend == 'Frontend') {
            await fsExtra.ensureDir(`${newPath}/Frontend`);
        } else {
            BackendOnly(newPath,answer.BackendType);
        }

        console.log("projects Created Successfully")
    } catch (error) {
        console.log("got the error", error);
    }
}

practice();