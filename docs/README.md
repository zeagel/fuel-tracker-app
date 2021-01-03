# Fuel Tracker App a.k.a. 'Tankkitutka'

## Full Stack Open 2020, Final Assigment

* **Author:** Mika Honkanen, mika.honkanen@gmail.com<br>
* **Work time bookkeeping:** [workTimeTracking.md](https://github.com/zeagel/fso2020-final-assigment/blob/master/docs/workTimeTracking.md) 
* **Demo app URL:** [mysterious-lowlands-95194.herokuapp.com/](https://mysterious-lowlands-95194.herokuapp.com/)
* **User guide:** [FTA-tankkitutka-user-guide.pdf](https://github.com/zeagel/fso2020-final-assigment/blob/master/docs/FTA-tankkitutka-user-guide.pdf)

## The App description
'**Tankkitutka**' is a fuel tracking web application which has been implemented with **NodeJS**, **ReactJS** and **MongoDB**. In the implementation of the application's user interface, there has been utilized **React Semantic UI**.

## Set the local development environment

### Preconditions
In order to run the application, you need to have **NodeJS** platform installed and Mongo DB collection available in **MongoDB Atlas**.

1. [Install NodeJS platform](https://www.tutorialspoint.com/nodejs/nodejs_environment_setup.htm)
2. [Create Mongo database in MongoDB Atlas](https://docs.atlas.mongodb.com/getting-started/)

### Clone the project in local env
    git clone git@github.com:zeagel/fso2020-final-assigment.git

### Install the backend and frontend
    cd fso2020-final-assigment/fuel-tracker-be/
    npm install

    cd ../fso2020-final-assigment/fuel-tracker-fe/
    npm install

### Set environment variables in backend
- create an empty `.env` file in the root of `fuel-tracker-be` directory
- add following variables in the `.env` file and remember to set your own details in the required places (marked with `<description>`):

```    
MONGODB_URI=mongodb+srv://<your-mongodb-username>:<your-mongodb-password>@cluster0-nscn5.mongodb.net/<your-mongodb-database-name>?retryWrites=true&w=majority

TEST_MONGODB_URI=mongodb+srv://<your-mongodb-username>:<your-mongodb-password>@cluster0-nscn5.mongodb.net/<your-mongodb-database-name>-test?retryWrites=true&w=majority

JWT_SECRET='<your-jwt-secret>'

PORT=5001
```

### Initialize database
If desired, the database of the application can be initialized with simple pre-defined test data that has been defined in `/fuel-tracker-be/tests/data/initEntries.js`.

Please note that this is an optional step. The application can be launched with empty database as well.
```
cd fso2020-final-assigment/fuel-tracker-be/
npm run initDb
```

### Launch the application

#### Backend
```
cd fso2020-final-assigment/fuel-tracker-be/
npm run start
```

#### Frontend
```
cd fso2020-final-assigment/fuel-tracker-fe/
npm run start
```

### Using the application 
When the app it running in the web browser (in the URL `http://localhost:3000/`), the using of it should be straightforward and intuitive. If necessary, more detailed instructions can be found in the [User Guide document](https://github.com/zeagel/fso2020-final-assigment/blob/master/docs/FTA-tankkitutka-user-guide.pdf).

## Testing
The project contains unit/integration tests for the **backend** operations. All tests locates in `/fuel-tracker-be/tests` directory.

*(In the currect version, there is none tests created for the frontend.)*

### Run all tests
```
cd fso2020-final-assigment/fuel-tracker-be/
npm run test
```

### Run one specific test file
```
cd fso2020-final-assigment/fuel-tracker-be/
npm test -- ./tests/<test-file>
```
## Deployment

### Preconditions

#### Heroku account and CLI
The project has been configured to deploy the full application in [Heroku service](https://www.heroku.com/home) utilizing **git subtree**. Free Heroku account can be created by following the [Sign Up instructions](https://signup.heroku.com/).

When you have the account created, [install the Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) in your environment. 

#### Init Heroku for the project
```
heroku create
```

#### Configure database connection
```
heroku config:set MONGODB_URI='mongodb+srv://<mongodb-username>:<password>@cluster0-nscn5.mongodb.net/<database>?retryWrites=true&w=majority'
```

#### Configure JWT secret
```
heroku config:set JWT_SECRET='<your-jwt-secret>' 
```

### Scripts for deployment
All deployment scripts are executed from the **backend** project:
```
cd fso2020-final-assigment/fuel-tracker-be/
npm run <deploy-script>
```
where `<deploy-script>` can one of the following command:
* **deploy:cleanOld** deletes old content from the `/web` directory that is the source for the deployments
* **deploy:prepFE** builds frontend and copies transpiled build files in the `/web` directory
* **deploy:prepBE** copies necessary backend files in the `/web` directory
* **deploy** pushes the latest production build of the app from the `/web` directory to Heroku
* **deploy:full** executes all deployment steps in a row and commits the latest changes also in the git master