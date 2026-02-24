import fsExtra from "fs-extra/esm";
import inquirer from "inquirer";

const practice = async () => {
    try {
        console.log("STARTING  the Process");

        const answer = await inquirer.prompt([{
            type: 'input',
            name: 'ProjectName',
            message: 'Write the Name of main Folder'

        },{
            type:'rawlist',
            name:'FrontendBackend',
            message:'What you want to create ?',
            choices:[
                'Frontend','Backend','Both'
            ]
        }
    ]);

        const newPath = `./output/${answer.ProjectName}`;
        
        await fsExtra.ensureDir(newPath);

        // await fsExtra.copy('./template/dbTemp.js', `${newPath}/New.js`);


        if(answer.FrontendBackend=='Both'){
            await fsExtra.ensureDir(`${newPath}/Frontend`);
            await fsExtra.ensureDir(`${newPath}/Backend`);

        }else if(answer.FrontendBackend=='Frontend'){
            await fsExtra.ensureDir(`${newPath}/Frontend`);
        }else{
            await fsExtra.ensureDir(`${newPath}/Backend`);
            await fsExtra.copy('./template/server',`${newPath}/Backend`);
        }

        console.log("projects Created Successfully")
    } catch (error) {
        console.log("got the error", error);
    }
}

practice();