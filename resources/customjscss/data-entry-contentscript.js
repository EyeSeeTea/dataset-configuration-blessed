(function() {
    var fixActionsBox = function() {
        // Button <run validation> does not fit in the box, add some more width.
        $("#completenessDiv").css("width", "+=25px");
    };

    var applyChangesToForm = function() {
        fixActionsBox();
    };

    var init = function() {
        $(document).on("dhis2.de.event.formLoaded", applyChangesToForm);
    };

    $(init);
})();