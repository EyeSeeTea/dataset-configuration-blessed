const _ = require('lodash');
const path = require('path');
const request_promise = require('request-promise');

const getDuplicates = (model) => {
  const plural = model + "s";
  const response$ = request_promise({
    method: "GET",
    uri: `http://localhost:9026/api/${plural}.json`
      + `?paging=false&fields=id,name,${model}Groups[id,name,${model}GroupSet[id,name]]`,
    headers: {'Authorization': 'Basic YWRtaW46ZGlzdHJpY3Q='},
    json: true,
  });

  return response$.then(response => {
    return _(response[plural]).map(item => {
      const groupSetWithDuplicates = _(item[model + "Groups"])
        .groupBy(group => group[model + "GroupSet"] && group[model + "GroupSet"].name)
        .toPairs()
        .filter(([itemGroupName, itemGroupSets]) => itemGroupName !== "undefined" && itemGroupSets.length > 1)
        .map(([itemGroupName, itemGroupSets]) => itemGroupName)
        .value();

      if (!_.isEmpty(groupSetWithDuplicates)) {
        return `${model}[${item.id} - ${item.name.slice(0, 20)}] has duplicate references to sets: ${groupSetWithDuplicates}`;
      }
    }).compact().join("\n");
  })
};

const main = (args) => {
  if (_(args).isEmpty()) {
    const scriptname = path.basename(__filename);
    console.error(`Usage: ${scriptname} SERVER_URL`)
    process.exit(1);
  } else {
    Promise.all([getDuplicates("dataElement"), getDuplicates("indicator")])
      .then(duplicates => console.log(duplicates.join("\n")));
  }
}

main(process.argv);
