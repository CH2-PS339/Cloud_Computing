# **BACKEND SERVICES**

This is a JavaScript code built using Node.js, so make sure you have Node.js installed on your system.
This service is using MySQL as the database, so you also have to run MySQL on your system.

1. Clone the repository then open it using your code editor.
2. Create a new file called.env in the project's root directory to hold the necessary configurations.
3. Include the following information in the.env file:

```
#Fill "" with your database host name ex: root 
DB_USERNAME= ""
#Fill "" with your database password
DB_PASSWORD= ""
#Fill "" with your database name ex: talentara
DB_NAME= "talentara"
#Fill "" with your database host name ex: localhost
DB_HOSTNAME="" 

```
4. Open terminal in the project root directory, then run ` npm install ` and then run ` npm install dotenv ` to install the dependencies.
5. Run the app using the command: ` node src/index.js `
6. The server will run in the localhost with the port 8080, open http://localhost:8080 to view it in your browser.
