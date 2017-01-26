## Scott Services Job Dashboard Backend Node Project Setup

### Development Dependencies
- Install node.js/npm - https://nodejs.org/en/
- [Optional] Visual Studio Code - https://code.visualstudio.com/
	- If you opt-out of using Code you will need another method of TypeScript transpiling (i.e. compile)
- Install typescript -> npm install -g typescript

### Running the Application
- Clone https://github.com/BelovedRobot/ScottDashboardWeb.git
- All dependencies will be defined within the project, but they're not copied so you need to execute "npm install" (sudo npm install if you get access denied error)
- Make a copy of .env.example and set values
    - NODE_ENV=(development|production)
- To run the app open a terminal and type "node server.js" or "npm run start-dev"

### Developing
- [Optional] Lite server config via bs-config.json
    - Make a copy of bs-config.json.example to bs-config.json and customize as needed
- [Optional] Visual Studio Code setup
	- Open the command palette by typing "command+shift+P" and type "task"
	- Then select the option to select "Configure Task Runner", this will show you a list of task templates
	- Choose either the "TypeScript - tsconfig.json" or "TypeScript - Watch Mode" template
		- The "TypeScript - tsconfig.json" template enables you to compile TypeScript manually (command+shift+B)
		- The "TypeScript - Watch Mode" template enables a watch mode, where just like the lite-server, every TypeScript change automatically triggers a transpiling task of ts -> js

### Deployment
- Website to Prod -> git push azure master (credentials stored by Zane, ask if you need them)
- Node Endpoint to Prod -> git push azure master (credentials stored by Zane, ask if you need them)

- Website to Dev -> git push azure-dev master (credentials stored by Zane, ask if you need them)
- Node Endpoint to Dev -> git push azure-dev master (credentials stored by Zane, ask if you need them)
