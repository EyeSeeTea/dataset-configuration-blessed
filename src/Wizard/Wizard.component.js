import React from "react";
import createReactClass from 'create-react-class';
import PropTypes from "prop-types";
import _ from "lodash";
import Translate from "d2-ui/lib/i18n/Translate.mixin";
import Toolbar from "material-ui/Toolbar/Toolbar";
import ToolbarGroup from "material-ui/Toolbar/ToolbarGroup";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import Card from "material-ui/Card/Card";
import CardText from "material-ui/Card/CardText";
import IconButton from "material-ui/IconButton";
import HelpOutlineIcon from "material-ui/svg-icons/action/help-outline";
import Dialog from "material-ui/Dialog/Dialog";
import FlatButton from "material-ui/FlatButton/FlatButton";
import Steps from "react-steps";

const Wizard = createReactClass({
    mixins: [Translate],

    propTypes: {
        fields: PropTypes.arrayOf(PropTypes.object),
        buttons: PropTypes.arrayOf(PropTypes.object),
        onFieldsChange: PropTypes.func,
    },

    getDefaultProps: function() {
        return {
            onFieldsChange: _.identity,
            nextEnabled: true,
            active: 0,
            doneUntil: 0,
        };
    },

    getInitialState() {
        return {
            helpOpen: false,
        };
    },

    _onPreviousClicked(ev) {
        ev.preventDefault();
        const newActive = _(this._getIndexedVisibleSteps())
            .map("index")
            .sortBy()
            .reverse()
            .find(idx => idx < this.props.active);
        this.props.onStepChange(newActive);
    },

    _onNextClicked(ev) {
        ev.preventDefault();
        const newActive = _(this._getIndexedVisibleSteps())
            .map("index")
            .sortBy()
            .find(idx => idx > this.props.active);
        this.props.onStepChange(newActive);
    },

    _openHelp() {
        this.setState({ helpOpen: true });
    },

    _closeHelp() {
        this.setState({ helpOpen: false });
    },

    render() {
        const indexedVisibleSteps = this._getIndexedVisibleSteps();
        if (!indexedVisibleSteps) return;

        const currentStep = this.props.steps[this.props.active];
        const items = indexedVisibleSteps.map(({ step, index }) => ({
            text: step.title,
            isActive: index === this.props.active,
            isDone: index < this.props.doneUntil,
        }));
        const actionsBar = currentStep.actionsBar || ["top", "bottom"];
        const firstStepIndex = indexedVisibleSteps[0].index;
        const lastStepIndex = indexedVisibleSteps[indexedVisibleSteps.length - 1].index;
        const showPrevious = this.props.active > firstStepIndex;
        const showNext = this.props.active < lastStepIndex;
        const actions = [
            <FlatButton label={this.getTranslation("close")} onClick={this._closeHelp} />,
        ];

        return (
            <div>
                <Dialog
                    title={this.getTranslation("help")}
                    actions={actions}
                    open={this.state.helpOpen}
                    onRequestClose={this._closeHelp}
                >
                    {currentStep.help}
                </Dialog>
                <Steps
                    items={items}
                    type="point"
                    styles={{
                        main: { fontFamily: "Roboto, sans-serif", fontSize: "1.2em" },
                        doneItemNumber: { background: "#3162C5" },
                        activeItemNumber: { background: "#FF9800" },
                        item: { display: "inline-table" },
                    }}
                />

                {_(actionsBar).includes("top") &&
                    this._renderButtons(
                        currentStep,
                        showPrevious,
                        showNext,
                        currentStep.help !== ""
                    )}

                <Card>
                    <CardText>
                        <currentStep.component
                            onFieldsChange={(...args) =>
                                this.props.onFieldsChange(currentStep.id, ...args)
                            }
                            {...currentStep.props}
                        />
                    </CardText>
                </Card>

                {_(actionsBar).includes("top") &&
                    this._renderButtons(currentStep, showPrevious, showNext, false)}
            </div>
        );
    },

    _getIndexedVisibleSteps() {
        return this.props.steps
            .map((step, index) => ({ step, index }))
            .filter(({ step }) => step.visible !== false);
    },

    _renderButtons(step, showPrevious, showNext, showHelp) {
        const renderHelp = () => (
            <ToolbarGroup lastChild={true}>
                <IconButton tooltip={this.getTranslation("help")} onClick={this._openHelp}>
                    <HelpOutlineIcon />
                </IconButton>
            </ToolbarGroup>
        );

        return (
            <Toolbar>
                <ToolbarGroup style={{ flexGrow: 3 }}>
                    <ToolbarGroup>
                        <RaisedButton
                            label={"← " + this.getTranslation("previous")}
                            disabled={this.props.previousEnabled === false || !showPrevious}
                            onClick={this._onPreviousClicked}
                        />
                        <RaisedButton
                            label={this.getTranslation("next") + " →"}
                            disabled={this.props.nextEnabled === false || !showNext}
                            onClick={this._onNextClicked}
                        />
                    </ToolbarGroup>

                    <ToolbarGroup>
                        {this.props.buttons.map(button =>
                            !button.showFunc || button.showFunc(step) ? (
                                <RaisedButton
                                    key={button.id}
                                    label={button.label}
                                    onClick={button.onClick}
                                />
                            ) : null
                        )}
                    </ToolbarGroup>
                </ToolbarGroup>
                {showHelp && renderHelp()}
            </Toolbar>
        );
    },
});

export default Wizard;
