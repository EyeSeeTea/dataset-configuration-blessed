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
        const newActive = Math.max(this.props.active - 1, 0);
        this.props.onStepChange(newActive);
    },

    _onNextClicked(ev) {
        ev.preventDefault();
        const stepsCount = this.props.steps.length;
        const newActive = Math.min(this.props.active + 1, stepsCount);
        this.props.onStepChange(newActive);
    },

    render() {
        const currentStep = this.props.steps[this.props.active];
        const items = this.props.steps.map((step, idx) => (
            {
                "text": step.title,
                "isActive": idx == this.props.active,
                "isDone": idx < this.props.doneUntil,
            }
        ));

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


                <Card>
                    <CardText>
                        <currentStep.component 
                            onFieldsChange={(...args) => 
                                this.props.onFieldsChange(currentStep.id, ...args)} 
                            {...currentStep.props} 
                        />
                    </CardText>
                </Card>

                {this._renderButtons(currentStep)}
            </div>
        );
    },

    _renderButtons(step) {
        return (
            <Toolbar>
                <ToolbarGroup>
                    <RaisedButton 
                        label={"← " + this.getTranslation("previous")}
                        disabled={this.props.active == 0}
                        onTouchTap={this._onPreviousClicked}
                    />
                    <RaisedButton 
                        label={this.getTranslation("next") + " →"}
                        disabled={!this.props.nextEnabled || 
                                  this.props.active >= this.props.steps.length - 1}
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