# dataset-configuration-blessed
Enhanced dataset manager Dhis2 app (blessed repository)

## Setup

```
$ nvm use
$ yarn install
```

## Build

Create DHIS2 app zip:

```
$ yarn build
```

## Start a development server

Clone the repository and execute:

```
$ yarn start
```

## Use the development version of d2-ui

Clone the d2-ui repository, checkout the branch you want to test and create a link using `yarn`:

```
$ git clone https://github.com/eyeseetea/d2-ui
$ cd d2-ui
$ git checkout BRANCH_TO_TEST
$ yarn install && yarn build
$ yarn link
```

And now, on `dataset-configuration`, run:

```
$ yarn link d2-ui
```

## Enable CORS

To set up your DHIS2 instance to work with the development service you will need to add the development servers address to the CORS whitelist. You can do this within the DHIS2 Settings app under the _access_ tab. On the access tab add `http://localhost:8081` to the CORS Whitelist.

The starter app will look for a DHIS 2 development instance configuration in
`$DHIS2_HOME/config`. So for example if your `DHIS2_HOME` environment variable is
set to `~/.dhis2`, the starter app will look for `~/.dhis2/config.js` and then
`~/.dhis2/config.json` and load the first one it can find. You can use `config/config.template.json` as reference.

The config should export an object with the properties `baseUrl` and
`authorization`, where authorization is the base64 encoding of your username and
password. You can obtain this value by opening the console in your browser and
typing `btoa('user:pass')`.

If no config is found, the default `baseUrl` is `http://localhost:8080/` and
the default username and password is `admin` and `district`, respectively.

See `webpack.config.js` for details.

## Frameworks/libraries

### React

[React](https://facebook.github.io/react/) is the _view_ part of the front-end applications, it has a component based architecture. At DHIS2 we also use JSX syntax that is generally used with React.

### d2 / d2-ui

[d2](https://github.com/dhis2/d2) is the DHIS2 abstraction library that allows you to communicate with the DHIS2 api in a programatic way. [d2-ui](https://github.com/dhis2/d2-ui) is the ui component library that is build on top of d2 to allow reuse of common components that are used within DHIS2 applications. d2-ui also contains our own application wiring code through its _stores_ and _actions_.

### material-ui

d2-ui makes use of [material-ui](http://www.material-ui.com) for rendering more basic components like TextFields and Lists. It is therefore quite useful to look into this library too when building DHIS2 apps and making use of d2-ui.
