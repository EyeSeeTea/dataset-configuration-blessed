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
window.underscore = _;

_.mixin({
    transpose: function(list) {
        return _.zip.apply(_, list);
    },

    inGroupsOf: function(source, n) {
        var dest = [];
        var source2 = _.clone(source);
        while(source2.length) {
          dest.push(source2.splice(0, n));
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
                var hasThemeHeader = _.size(tabsByTheme) > 0;
                var themeNameTitle = themeName !== emptyField ? themeName : "Default";
                var subsectionKey = (sectionName + "-" + themeName).replace(/ /g, "");

                return $("<li/>").addClass("panel panel-default").append(
                    hasThemeHeader ? getThemeHeader(themeNameTitle, subsectionKey) : $("<span/>"),
                    $("<div/>").attr("id", subsectionKey).addClass("panel-collapse in").append(
                        _.map(tabsByGroup, (elementsInGroup, groupName) => {

                            return $("<div/>", {class: "group"}).append(
                                groupName !== emptyField ? $("<h4/>").css({display: 'none'}).text(groupName) : $("<span/>"),
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
    // renderAsTabs == true
    _.each(getGroupedTabs(), processGroupedTab);

    // renderAsTabs == false
    $(".formSection .cent h3").toArray().map($).forEach(titleTag => {
        titleTag.text(titleTag.text().replace(/@/g, " → "));
    });
};

var hideGreyedColumnsAndSplit = function() {
    $(".sectionTable").not(".floatThead-table").get().map($).forEach(table => {
        var firstRow = table.find("tbody tr:first-child td .entryfield");
        if (firstRow.size() === 0)
            return;
        var cocIds = firstRow.get().map(input => $(input).attr("id").split("-")[1]);
        var tdInputs = table.find("tbody tr td .entryfield").get();

        var disabledCocIds = _.chain(table.find("tbody .entryfield").get())
            .groupBy(input => $(input).attr("id").split("-")[1])
            .map((tds, cocId) => _.every(tds, td => td.disabled) ? cocId : null)
            .compact()
            .value();

        var categories = table.find("thead tr").get()
            .map(tr => _.chain($(tr).find("th[scope=col]").get()).map(th => $(th).text().trim()).uniq().value());
            
        // Get cartesian product of headers (categories) and remove disabled categoryOptionCombos
        var cocs = _.chain(categories)
            .cartesianProduct()
            .zip(cocIds)
            .map(pair => ({cos: pair[0], id: pair[1]}))
            .reject(coc => _(disabledCocIds).contains(coc.id))
            .value();

        var rows = _.chain(table.find("tbody tr").get()).map($).map(tr => {
            var td = tr.find("td:first-child");
            var tdId = td.attr("id");
            if (tdId) {
                var deId = tdId.split("-")[0];
                var deName = td.text().trim();
                var valuesByCocId = _.chain(tr.find("td .entryfield").get()).map($).map(input => {
                    var cocId = input.attr("id").split("-")[1];
                    return [cocId, {td: input.parent("td"), coc: cocId}];
                }).object().value();
                return {de: {id: deId, name: deName, td: td}, valuesByCocId: valuesByCocId};
            }
        }).compact().value();

        var data = {
            group: table.parents("div.group").find("h4").text(),
            categories: categories,
            cocs: cocs,
            rows: rows,
            showRowTotals: table.find("tbody tr:first-child td:last-child input.total-cell").size() > 0,
            showColumnTotals: table.find("tbody tr:last-child td:nth-child(2) input.total-cell").size() > 0,
        };

        var newTables = splitTables(data, {categoryIndex: 0, tableIndex: 0});
        table.replaceWith($("<div>").append(newTables));
    });
};

var splitTables = function(data, options) {
    var categoryIndex = options.categoryIndex;
    var nCategories = data.categories.length;
    var renderDataElementInfo = (options.tableIndex === 0);
    var table = buildTable(data, renderDataElementInfo);

    if (categoryIndex >= nCategories - 1 || tableFitsInViewport(table)) {
        return [table];
    } else {
        return _.chain(data.cocs)
            .groupConsecutiveBy(coc => coc.cos.slice(0, categoryIndex + 1))
            .map((splitCocs, splitTableIndex) =>
                splitTables(_.extend({}, data, {cocs: splitCocs}),
                    {categoryIndex: categoryIndex + 1, tableIndex: options.tableIndex + splitTableIndex}))
            .flatten(1)
            .value();
    }
};

var buildTable = function(data, renderDataElementInfo) {
    var getValues = (row) => data.cocs.map(coc => row.valuesByCocId[coc.id]);
    var nCategories = data.categories.length;
    var categoryThsList = _.range(nCategories).map(categoryIndex => {
        return _.chain(data.cocs)
            .groupConsecutiveBy(coc => coc.cos.slice(0, categoryIndex + 1))
            .map(group => {
                var label = group[0].cos[categoryIndex];
                return $("<th>", {class: "nrcdataheader", colspan: group.length, scope: "col"}).text(label);
            })
            .value();
    });

    return $("<table>", {id: "sectionTable", class: "sectionTable", cellspacing: "0"}).append([
        $("<thead>").append(
            categoryThsList.map((categoryThs, index) => $("<tr>").append(
                $("<th>", {class: "nrcinfoheader"})
                    .html(renderDataElementInfo && index === 0 ? data.group : "&nbsp;"),
                categoryThs,
                index === 0 && data.showRowTotals ?
                    $("<th>", {class: "nrctotalheader", rowspan: nCategories, verticalAlign: "top"}).text("Total") :
                    null
            ))
        ),
        $("<tbody>").append(
            data.rows.map(row => {
                // id = "row-DE-COC1-COC2-.."
                var rowTotalId = ["row", row.de.id].concat(getValues(row).map(val => val.coc)).join("-");
                var rowTotal = $("<input>", {class: "dataelementtotal", type: "text", disabled: "", id: rowTotalId});
                return $("<tr>", {class: ["derow", "de-" + row.de.id, renderDataElementInfo ? "primary" : "secondary"].join(" ")}).append(
                    $("<td>", {class: "nrcindicatorName"})
                        .css("opacity", renderDataElementInfo ? 1 : 0).html(row.de.td.children()),
                    getValues(row).map(val => val.td.clone()),
                    data.showRowTotals ? $("<td>").append(rowTotal) : null
                );
            }),
            data.showColumnTotals ?
                $("<tr>").append(
                    $("<td>", {class: "nrcindicatorName"}).text("Total"),
                    getValues(data.rows[0]).map(val =>
                        $("<td>").append(
                            $("<input>", {class: "dataelementtotal", type: "text", id: "col-" + val.coc, disabled: ""})
                        )
                    )
                ) : null
        )
    ]);
};

var tableFitsInViewport = function(table) {
    // Add the table temporally to the DOM to get its real size
    var content = $("#contentDiv");
    content.show();
    table.appendTo(content);
    var maxWidth = $(window).width() - content.offset().left;
    var tableWidth = table.width();
    var fits = tableWidth <= maxWidth;
    content.hide();
    table.remove();
    return fits;
};

var fixActionsBox = function() {
    // Button <run validation> does not fit in the box, add some more width.
    $("#completenessDiv").css("width", "+=5px");
};

var renumerateInputFields = function() {
    var lastIndex = _.chain($("[tabindex]").get()).map(x => parseInt($(x).attr("tabindex"))).max().value() || 0;
    $("#contentDiv .entryfield").each((i, input) => $(input).attr("tabindex", lastIndex + i + 1));
};

var prettyGroups = function() {
    _($(".group").get()).each(group => $(group).find(".nrcinfoheader:not(:first)").text(""));
    _($(".group").get()).each(group => $(group).find(".indicatorArea:not(:last)").remove());
};


var highlightDataElementRows = function() {
    var setClass = function(ev, className, isActive) {
        var tr = $(ev.currentTarget);
        var de_class = (tr.attr("class") || "").split(" ").filter(cl => cl.startsWith("de-"))[0];
        if (de_class) {
            var deId = de_class.split("-")[1];
            var el = $(".de-" + deId);
            el.toggleClass(className, isActive);
            if (tr.hasClass("secondary")) {
                var opacity = isActive ? 1 : 0;
                tr.find(".nrcindicatorName").clearQueue().delay(500).animate({opacity: opacity}, 100);
            }
        }
    };

    $("tr.derow")
        .mouseover(ev => setClass(ev, "hover", true))
        .mouseout(ev => setClass(ev, "hover", false))
        .focusin(ev => setClass(ev, "focus", true))
        .focusout(ev => setClass(ev, "focus", false));
};

var applyChangesToForm = function() {
    groupSubsections();
    hideGreyedColumnsAndSplit();
    renumerateInputFields();
    prettyGroups();
    fixActionsBox();
    highlightDataElementRows();
};

var init = function() {
    var contentDiv = $("#contentDiv");
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