/*

    Groups tabs dynamically in dhis-web-dataentry on form load. You usually use this content
    script as a custom Javascript in the <Custom JS/CSS> app.

    Requirements:
        - Dataset sections must have hierarchical names: "SECTION@THEME@GROUP".

    Actions:
        - Sections are grouped into a single tab.
        - Themes without a section are grouped as collapsible elements.
        - Groups within a theme are grouped.
*/

var runOnMutation = function(contentEl, callback) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (!MutationObserver) throw "Mutation is not supported by this browser";
    var hasChildren = contentEl.children().size() > 0;
    var observer = new MutationObserver(function() {
        if (!hasChildren && contentEl.children().size() > 0) {
            callback();
            hasChildren = true;
        }
    });

    observer.observe(contentEl.get(0), {subtree: true, attributes: true});
};

var css = `
    .red {
       color: red;
    }

    .nrcsubsection {
        background-color: #fff;
        height: 5px;
    }

    input.entryfield {
        width: 70px;
        height: 18px;
        padding: 2px;
    }

    input.dataelementtotal {
        width: 70px;
        height: 16px;
        padding: 2px;
    }

    input.indicator {
        width: 70px;
        height: 18px;
        padding: 2px;
    }

    tr:hover {
        background-color: #e5e5e5
    }

    th {
        border-style: hidden !important;
    }

    td {
        padding: 2px !important;
        height: 16px;
        text-align: center;
        border-style: none !important;
    }

    td.nrcindicatorName {
        text-align: left;
    }

    td.lastinrow {
        background-color: #eee;
        text-align: center;
    }

    th.nrcinfoheader {
        text-align: left;
        border-bottom-style: hidden;
        border-left-style: hidden;
        border-top-style: hidden;
        width: 100%;
        white-space: nowrap;
        background-color: #fff;
        padding: 2px !important;
    }

    th.nrcdataheader {
        text-align: center;
        border-bottom: 1px solid #ddd !important;
        background-color: #eaf7fb;
        white-space: nowrap;
        padding-top: 2px !important;
        padding-bottom: 2px !important;
        padding-left: 10px;
        padding-right: 10px;
    }

    th.nrctotalheader {
        text-align: center;
        border-bottom: 1px solid #ddd !important;
        background-color: #eee;
        white-space: nowrap;
        padding-top: 2px !important;
        padding-bottom: 2px !important;
        padding-left: 10px;
        padding-right: 10px;
    }

    .panel {
        margin-bottom: 7px;
    }

    .panel-body {
        padding-top: 0;
        padding-left: 8px;
        padding-right: 8px;
        padding-bottom: 4px;
    }

    .panel-default > .panel-heading {
        background-color: #3c3c3c;
        border-color: #3c3c3c;
        padding: 7px;
        margin-bottom: 5px;
        cursor: move;
    }

    a.nrc-panel-title {
        color: white;
        cursor: pointer;
    }
     
    .accordion-toggle:after {
        font-family: FontAwesome;
        content: "\\f077";
        float: right;
        color: white !important;
    }

    .panel-heading.collapsed .accordion-toggle:after {
        content: "\\f078";
    }
`;

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

var injectCss = function(styles) {
    $("<style/>", {type: "text/css"}).text(styles).appendTo(document.head);
};

var emptyField = "__undefined";

var getTag = function(el, separator, name) {
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

var processSection = function(tabsByTheme, sectionName) {
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
                                    return getTabContents(tab).clone().children();
                                }))
                            );
                        })
                    )
                );
            })
        );

    var tabs = _($("#tabs li").toArray())
        .select(el => $(el).text() === sectionName || $(el).text().startsWith(sectionName + "@"));
    var mainTab = $(tabs[0]);

    getTabContents(mainTab).html(groupedContents);
    mainTab.find("a").text(sectionName);
    $(tabs.slice(1)).remove();
};

var getGroupedTabs = function(separator) {
    return _.chain($("#tabs li").toArray())
        .groupBy(el => getTag(el, separator, "section"))
        .map((elementInSection, sectionName) => {
            var tabsByTheme = _.chain(elementInSection)
                .groupBy(el => getTag(el, separator, "theme"))
                .map((elementsInTheme, themeName) => {
                    var tabsByGroup = _.groupBy(elementsInTheme, el => getTag(el, separator, "group"));
                    return [themeName, tabsByGroup];
                })
                .object()
                .value();
            return [sectionName, tabsByTheme];
        })
        .object()
        .value();
};

var groupSubsections = function(options) {
    var separator = options.separator || "@";
    var groupedTabs = getGroupedTabs(separator);
    _.each(groupedTabs, processSection);
};

var init = function() {
    console.log("data-entry-contentscript: init");
    runOnMutation($("#contentDiv"), () => {
        groupSubsections({separator: "@"});
    });

    loadJs("../dhis-web-commons/bootstrap/js/bootstrap.min.js");
    loadCss("../dhis-web-commons/bootstrap/css/bootstrap.min.css");
    injectCss(css);
};

$(init);
