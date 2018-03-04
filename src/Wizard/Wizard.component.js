import React from 'react';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import Toolbar from 'material-ui/Toolbar/Toolbar';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
import RaisedButton from 'material-ui/RaisedButton/RaisedButton';
import Card from 'material-ui/Card/Card';
import CardText from 'material-ui/Card/CardText';
import Steps from 'react-steps';

const Wizard = React.createClass({
    mixins: [Translate],

    propTypes: {
        fields: React.PropTypes.arrayOf(React.PropTypes.object),
        buttons: React.PropTypes.arrayOf(React.PropTypes.object),
        onFieldsChange: React.PropTypes.func,
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
        };
    },

    _onPreviousClicked(ev) {
        ev.preventDefault();
        const newActive = _(this._getIndexedVisibleSteps())
            .map("index").sortBy().reverse().find(idx => idx < this.props.active);
        this.props.onStepChange(newActive);
    },

    _onNextClicked(ev) {
        ev.preventDefault();
        const newActive = _(this._getIndexedVisibleSteps())
            .map("index").sortBy().find(idx => idx > this.props.active);
        this.props.onStepChange(newActive);
    },

    render() {
        const indexedVisibleSteps = this._getIndexedVisibleSteps();
        if (!indexedVisibleSteps)
            return;

        const currentStep = this.props.steps[this.props.active];
        const items = indexedVisibleSteps
            .map(({step, index}) => ({
                "text": step.title,
                "isActive": index === this.props.active,
                "isDone": index < this.props.doneUntil,
            }));
        const actionsBar = currentStep.actionsBar || ["top", "bottom"];
        const firstStepIndex = indexedVisibleSteps[0].index;
        const lastStepIndex = indexedVisibleSteps[indexedVisibleSteps.length - 1].index;
        const showPrevious = this.props.active > firstStepIndex;
        const showNext = this.props.active < lastStepIndex;
        const buttons = this._renderButtons(currentStep, showPrevious, showNext);

        return (
            <div>
                <Steps 
                    items={items} 
                    type="point" 
                    styles={{
                        main: {fontFamily: 'Roboto, sans-serif', fontSize: '1.2em'},
                        doneItemNumber: {background: "#3162C5"},
                        activeItemNumber: {background: "#FF9800"},
                    }}/>


                {_(actionsBar).includes("top") && buttons}

                <Card>
                    <CardText>
                        <currentStep.component 
                            onFieldsChange={(...args) => 
                                this.props.onFieldsChange(currentStep.id, ...args)} 
                            {...currentStep.props} 
                        />
                    </CardText>
                </Card>

                {_(actionsBar).includes("bottom") && buttons}
            </div>
        );
    },

    _getIndexedVisibleSteps() {
        return this.props.steps
            .map((step, index) => ({step, index}))
            .filter(({step}) => step.visible !== false);
    },

    _renderButtons(step, showPrevious, showNext) {
        return (
            <Toolbar>
                <ToolbarGroup>
                    <RaisedButton
                        label={"← " + this.getTranslation("previous")}
                        disabled={this.props.previousEnabled === false || !showPrevious}
                        onTouchTap={this._onPreviousClicked}
                    />
                    <RaisedButton
                        label={this.getTranslation("next") + " →"}
                        disabled={this.props.nextEnabled === false || !showNext}
                        onTouchTap={this._onNextClicked}
                    />
                </ToolbarGroup>

                <ToolbarGroup>
                    {this.props.buttons.map(button =>
                        !button.showFunc || button.showFunc(step) ?
                            (<RaisedButton
                                key={button.id}
                                label={button.label}
                                onTouchTap={button.onClick} />) :
                            null
                    )}
                </ToolbarGroup>
            </Toolbar>
        );
    },
});

export default Wizard;