# Traditional AWS Cognito Node Web App using Intra ID as Identity Provider 

## Architecture
Browser → Node.js App → Amazon Cognito (User Pool)
                              ↕ SAML/OIDC
                        Microsoft Entra ID (IdP)
                              ↓
                    Returns JWT to Node.js App

## Scenario
* `Navigate to app` http://localhost:3000
* `Redirected to Intra ID for authentication when there is no active session`
* `Landing page to app home`
* `Logout`

## Setup AWS Cognito
* `Setup User Pool` \
    Application Type: Traditional Web Application 
* `App Clients->Login Pages` \
    Allowed callback URLs: http://localhost:3000/callback \
    Allowed sign-our URLs: http://localhost:3000/loggedout
* `Authentication->Social and External Providers` \
    Federated sign-in options: SAML \
    Upload metadata xml from IntraID \
    email: http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress


## Setup Intra ID as IDP
* `Create you Own Application` \
    Name of App \
    Non-gallery
* `Single sign-on with SAML`
    Identifier: urn:amazon:cognito:sp:ap-southeast-[your-identifier] \
    Reply URL: https://ap-southeast-[your-identifier].auth.ap-southeast-2.amazoncognito.com/saml2/idpresponse 
* `Attributes & Claims' \
    emailaddress: http://schemas.xmlsoap.org/ws/2005/05/identity/claims : user.mail
* `Federation Metadata XML` \
    Download then upload to AWS Cognito->User pool->Authentication->Social and External Providers


## Build and test in local
* `setup environment file` cp .env.example .env
* `install dependencies` npm install
* `run` node app.js
* `test` http://localhost:3000




