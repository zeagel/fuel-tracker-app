# Exercise 11.21: Own pipeline

## Full Stack Open 2020, part 11: Continuous Integration

*  **Author:** Mika Honkanen, mika.honkanen@gmail.com
*  **Demo App URL:**  [tankkitutka.herokuapp.com/](https://tankkitutka.herokuapp.com/)
* **Based on:** [Full Stack Open 2020, final assignment: Fuel Tracker App a.k.a. 'Tankkitutka'](https://github.com/zeagel/fso2020-final-assigment)
  
## Description
The project contains two Github Action workflows:
### Deployment pipeline
The workflow is triggered when a new merge or push is done on the master branch. Or when a new pull request is made towards the master.

**The workflow contains following steps:**
* checkout repository
* fetch git repo objects and refs
* set up node
* install backend
* create dotenv file for the backend
* lint backend
* run backend integration tests
* install frontend
* lint frontend
* make frontend production build
* run E2E tests in prod build (cypress)
* prepare deployment package
* get previous tag
* set previous tag in package.json of deployment package
* bump package.json version of deployment package
* deployment to Heroku
* build notification to Slack
* tag deployment on Github (_but not commit the update in package.json!_)

#### Additional details about the steps:

* Deployment and tagging steps are executed only when there is done merge or push to master. 
* Deployment and tagging steps can be skipped by giving tag `#skip` in the commit message.
* Pull requests trigger only the validation/testing steps.
* Version bumping updates the patch value by default. Major or minor bumping can be triggered by giving tag `#major` or `#minor` in the commit message.
* Healthy check after Heroku deployment is done utilizing endpoint `/api/health` which returns string `ok` if the application is running. If healthy check fails, the earlier version of the app is restored.
* Version of the application can be verified using the endpoint `/api/version` which reads the version information from the `package.json` files and returns it in JSON format `{ version: X.Y.Z }`.
* Build notification (_OK, failure_) are sent to Full Stack Open Slack on the channel `#code`.
* The version update **is not committed** in the package.json file in the source code. Because Github actions cannot do this operation in the **protected branches**. User must take care of this step by himself.

### Periodic health check
Ensures that the app is alive by pinging it regularly once a day at 8:00 am (UTC).