/*
Github module for https://github.com/eisnerd/feedback-tool

You need a personal token that will be used both as a reporter user and to upload screenshot
images. Steps:

  - Create a specific github user.
  - Create a project (i.e.) snapshots to store images.
  - Create a personal token:
    - User -> Settings -> Developer Settings -> Personal access tokens -> Generate new token
    - Description: Upload screenshots for feedback.js
    - Select scopes: repo -> public_repo.
    - Generate token.

This token should be kept secret, outside of any public repository. If that's too much of a
hassle, it should be encoded somehow in the source. That's not secure (anyone could take
it and upload files to our snapshot repo), but at least you won't get it automatically
revoked by github.

Usage:

  $.feedbackGithub({
    token: "PERSONAL_TOKEN",
    issues: {
      repository: "ORG/PROJECT_WHERE_ISSUES_WILL_BE_CREATED",
      title: "User feedback",
      renderBody: body => ["## Some report", "", body].join("\n"),
    },
    snapshots: {
      repository: "ORG2/PROJECT_WHERE_SNAPSHOTS_WILL_BE_UPLOADED_TO",
      branch: "master",
    },
    feedbackOptions: {},
  });
*/

class FeedBackToolGithub {
  constructor(options) {
    this.token = options.token;
    this.issues = options.issues;
    this.snapshots = options.snapshots;
    this.feedbackOptions = options.feedbackOptions;
  }
  
  init() {
    $.feedback(Object.assign({}, {
      postFunction: this._sendReport.bind(this),
    }, this.feedbackOptions));
  }
  
  _setAuthHeader(xhr) {
    xhr.setRequestHeader("Authorization", "token " + this.token);
  }
  
  _sendReport(data) {
    // data.post.img = "data:image/png;base64,iVBORw0KG..."
    const imgBase64 = data.post.img.split(",")[1];
    const uid = new Date().getTime() + parseInt(Math.random() * 1e6).toString();
     
    this._uploadFile("screenshot-" + uid + ".png", imgBase64)
      .then(url => this._postIssue(data, url))
      .then(data.success, data.error);
  }

  _uploadFile(filename, contents) {
    const payload = {
      "message": "feedback.js snapshot",
      "branch": this.snapshots.branch,
      "content": contents,
    };
    
    return $.ajax({
      url: 'https://api.github.com/repos/' + this.snapshots.repository + '/contents/' + filename,
      type: "PUT",
      beforeSend: this._setAuthHeader.bind(this),
      dataType: 'json',
      data: JSON.stringify(payload),
    }).then(res => res.content.download_url);
  }

  _postIssue(data, screenshotUrl) {
    const info = data.post;
    const browser = info.browser;
    const body = [
      "## Browser",
      "- Name: " + browser.appCodeName,
      "- Version: " + browser.appVersion,
      "- Platform: " + browser.platform,
      "## User report",
      "URL: " + info.url,
      "",
      info.note,
      "",
      "![screenshot](" + screenshotUrl + ")",
    ].join("\n")
    const payload = {
      "title": this.issues.title,
      "body": this.issues.renderBody ? this.issues.renderBody(body) : body,
    };
    
    return $.ajax({
      type: "POST",
      url: 'https://api.github.com/repos/' + this.issues.repository + '/issues',
      beforeSend: this._setAuthHeader.bind(this),
      dataType: 'json',
      data: JSON.stringify(payload),
    });
  }
}

$.feedbackGithub = function(options) {
  const feedBackToolGithub = new FeedBackToolGithub(options);
  feedBackToolGithub.init();
  return feedBackToolGithub;
}