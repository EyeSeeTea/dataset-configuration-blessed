(function() {
    var fixActionsBox = function() {
        // Button <run validation> does not fit in the box, add some more width.
        $("#completenessDiv").css("width", "+=25px");
    };

    var applyChangesToForm = function() {
        fixActionsBox();
    };

    var selectProjectFromDataset = function(ev) {
        var dataSetName = $("#selectedDataSetId option:selected").text();

        var projectSelect = $(".selectionLabel")
            .filter(function() { return $(this).text() === "Project" })
            .siblings("select");
        var optionToSelect = projectSelect
            .find("option")
            .filter(function() { return dataSetName.indexOf($(this).text()) >= 0; });
        if (optionToSelect.get(0)) {
            optionToSelect.prop("selected", true);
        } else {
            projectSelect.find("option:first").prop("selected", true);
        }
    };

    var autoselectProject = function() {
        $("#selectedDataSetId, #selectedPeriodId").change(selectProjectFromDataset);
    };

    var init = function() {
        $(document).on("dhis2.de.event.formLoaded", applyChangesToForm);
        autoselectProject();
    };

    $(init);
})();