/*

    Groups tabs dynamically in dhis-web-dataentry on form load. You usually use this content
    script as a custom Javascript in the <Custom JS/CSS> app.

    Requirements:
        - Dataset sections must have hierarchical names: "SECTION@THEME@GROUP".

    Actions:
        - Sections are grouped into a single tab.
        - Themes without a section are grouped as collapsible elements.
        - Groups within a theme are grouped.
        - Columns with all fields greyed out are removed
        - Tables with width greater than the view port will be split across categories.
*/

(function() {

// Underscore.js
var _ = window._.noConflict();

_.mixin({
    transpose: function(list) {
        return _.zip.apply(_, list);
    },

    inGroupsOf: function(source, n) {
        var dest = [];
        while(source.length) {
          dest.push(source.splice(0, n))
        }
        return dest;
    },

    cartesianProduct: function(args) {
        return _.reduce(args, function(a, b) {
            return _.flatten(_.map(a, function(x) {
                return _.map(b, function(y) { return x.concat([y]); });
            }), true);
        }, [[]]);
    },

    groupConsecutiveBy: function(xs, mapper) {
        mapper = mapper || _.identity;
        var reducer = (acc, x) => {
            if (_.isEmpty(acc)) {
                return acc.concat([[x]]);
            } else {
                var last = _.last(acc);
                if (_.isEqual(mapper(_.last(last)), mapper(x))) {
                    last.push(x);
                    return acc;
                } else {
                    return acc.concat([[x]]);
                }
            }
        };
        return _(xs).reduce(reducer, []);
    },
});

var loadCss = function(url) {
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        href: url,
    }).appendTo(document.head);
};

var loadJs = function(url, cb) {
    $.getScript(url, cb);
};

var contentSelector = "#contentDiv";

var emptyField = "__undefined";

var separator = "@";

var getTag = function(el, name) {
    var idx = {section: 0, theme: 1, group: 2}[name];
    return $(el).text().split(separator)[idx] || emptyField;
};

var getTabContents = function(tab) {
    return $("#" + $(tab).attr("aria-controls"));
};

var getThemeHeader = function(title, target) {
    return (
        $("<div/>").addClass("panel-heading").attr({"data-target": "#" + target, "data-toggle": "collapse"}).append(
            $("<h5/>").addClass("panel-title accordion-toggle").append(
                $("<a/>").addClass("nrc-panel-title").text(title)
            )
        )
    );
};

var processGroupedTab = function(tabsByTheme, sectionName) {
    var groupedContents =
        $("<ul/>").addClass("list-unstyled").append(
            _.map(tabsByTheme, (tabsByGroup, themeName) => {
                var hasThemeHeader = _.size(tabsByTheme) > 1;
                var themeNameTitle = themeName !== emptyField ? themeName : "Default";
                var subsectionKey = (sectionName + "-" + themeName).replace(/ /g, "");

                return $("<li/>").addClass("panel panel-default").append(
                    hasThemeHeader ? getThemeHeader(themeNameTitle, subsectionKey) : $("<span/>"),
                    $("<div/>").attr("id", subsectionKey).addClass("panel-collapse collapse in").append(
                        _.map(tabsByGroup, (elementsInGroup, groupName) => {
                            var showGroupTitle = _.size(tabsByGroup) > 1 && groupName !== emptyField;

                            return $("<div/>").append(
                                showGroupTitle ? $("<h4/>").text(groupName) : $("<span/>"),
                                $("<div/>").append(_.map(elementsInGroup, (tab) => {
                                    return getTabContents(tab).html();
                                }))
                            );
                        })
                    )
                );
            })
        );

    var tabs = _($("#tabs li").toArray())
        .select(el => $(el).text().split(separator)[0] === sectionName);
    var mainTab = $(tabs[0]);

    getTabContents(mainTab).html(groupedContents);
    mainTab.find("a").text(sectionName);
    $(tabs.slice(1)).remove();
};

var getGroupedTabs = function() {
    return _.chain($("#tabs li").toArray())
        .groupBy(el => getTag(el, "section"))
        .map((elementInSection, sectionName) => {
            var tabsByTheme = _.chain(elementInSection)
                .groupBy(el => getTag(el, "theme"))
                .map((elementsInTheme, themeName) => {
                    var tabsByGroup = _.groupBy(elementsInTheme, el => getTag(el, "group"));
                    return [themeName, tabsByGroup];
                })
                .object()
                .value();
            return [sectionName, tabsByTheme];
        })
        .object()
        .value();
};

var groupSubsections = function() {
    // renderAsTabs = true
    _.each(getGroupedTabs(), processGroupedTab);

    // renderAsTabs = false
    $(".formSection .cent h3").toArray().map($).forEach(titleTag => {
        titleTag.text(titleTag.text().replace("@", " → "));
    });
};

var buildTable = function(table, data) {
    var nCategories = data[0].categories.length;
    var categoryRows = _.range(nCategories).map(categoryIndex => {
        return _.chain(data)
            .map(columnData => columnData.categories)
            .groupConsecutiveBy(xs => xs.slice(0, categoryIndex+1))
            .map(group => {
                var label = group[0][categoryIndex];
                return $("<th />", {colspan: group.length, scope: "col"})
                    .append($("<span />", {align: "center"}).text(label))
            })
            .value();
    });

    var newTable = table.clone();

    // Show only enabled headers
    _.chain(newTable.find("thead tr").get().map($)).zip(categoryRows).each(pair => {
        var tr = pair[0], row = pair[1];
        tr.find("th").remove()
        tr.append(row);
    });

    // Show only enabled data entries
    var rowValues = _.transpose(data.map(columnData => columnData.values));

    _.chain(newTable.find("tbody tr").get().map($)).zip(rowValues).each(pair => {
        var tr = pair[0], values = pair[1];
        tr.find("td").slice(1).remove();
        tr.append(values);
    });

    return newTable;
};

var hideGreyedColumns = function() {
    $(".sectionTable").not(".floatThead-table").get().map($).forEach(table => {
        // Get fully disabled columns
        var nColumns = table.find("tbody tr:nth-child(1) td input").size();
        if (nColumns == 0)
            return;
        var tdInputs = table.find("tbody tr td input").get();
        var rows = _.chain(tdInputs).inGroupsOf(nColumns).value();
        var columns = _.transpose(rows);
        var disabledColumnIndexes = _.chain(columns)
            .map((inputs, idx) => _.all(inputs, input => input.disabled) ? idx : null)
            .reject(x => x === null)
            .value();

        // Get cartesian product of headers (categories) and remove disabled categoryOptionCombos
        var categoryOptionsList = _(table.find("thead tr").get())
            .map(tr => _.chain($(tr).find("th")).map(th => $(th).text().trim()).uniq().value())
        var nCategories = categoryOptionsList.length;
        var transposedValues = _.transpose(_.inGroupsOf(table.find("tbody tr td:not(:first-child)").get(), nColumns));
        var allData = _.chain(categoryOptionsList)
            .cartesianProduct()
            .zip(transposedValues)
            .map(pair => ({categories: pair[0], values: pair[1]}))
            .value();
        var data = _.chain(_.range(allData.length))
            .difference(disabledColumnIndexes).map(idx => allData[idx]).value();

        var newTables = splitTables(table, data, 0);
        table.replaceWith($("<div>").append(newTables));
    })
};

var splitTables = function(origTable, data, index) {
    var nCategories = data[0].categories.length;
    var table = buildTable(origTable, data);
    var tableFitsInViewport = function(table) {
        // Add the table temporally to the DOM to get real sizes
        table.appendTo("#mainPage");
        var maxWidth = $(window).width() - $("#mainPage").offset().left;
        var fits = table.width() <= maxWidth;
        table.remove();
        return fits;
    };

    if (index >= nCategories - 1 || tableFitsInViewport(table)) {
        return [table];
    } else {
        return _.chain(data)
            .groupConsecutiveBy(columnData => _.take(columnData.categories, index + 1))
            .map(splitData => splitTables(origTable, splitData, index + 1))
            .flatten(1)
            .value();
    }
};

var fixActionsBox = function() {
    // Button <run validation> does not fit in the box, add some more width.
    $("#completenessDiv").css("width", "+=5px");
};

var applyChangesToForm = function() {
    groupSubsections();
    hideGreyedColumns();
    fixActionsBox();
};

var init = function() {
    var contentDiv = $(contentSelector);
    var isDataEntryPage = window.dhis2 && window.dhis2.de &&
        window.dhis2.de.updateIndicators && contentDiv.length > 0;

    if (isDataEntryPage) {
        $(document).on( "dhis2.de.event.formLoaded", applyChangesToForm);
        loadJs("../dhis-web-commons/bootstrap/js/bootstrap.min.js");
        loadCss("../dhis-web-commons/bootstrap/css/bootstrap.min.css");
    }
};

var safeInit = function() {
    try {
        console.log("CustomJS init");
        return init();
    } catch(err) {
        console.error("CustomJS error: ", err);
    }
}

$(safeInit);

})();