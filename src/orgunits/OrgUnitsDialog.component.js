import React, { PropTypes, createClass } from 'react';
import { config } from 'd2/lib/d2';
import Dialog from 'material-ui/Dialog/Dialog';
import FlatButton from 'material-ui/FlatButton/FlatButton';
import Toggle from 'material-ui/Toggle/Toggle';
import Translate from 'd2-ui/lib/i18n/Translate.mixin';
import orgUnitsStore from './orgUnits.store';
import orgUnitsActions from './orgUnits.actions';
import LoadingMask from 'd2-ui/lib/loading-mask/LoadingMask.component';
import OrganisationUnitTreeMultiSelect from '../forms/form-fields/orgunit-tree-multi-select';
import Heading from 'd2-ui/lib/headings/Heading.component';

export default createClass({
    propTypes: {
        objects: PropTypes.arrayOf(PropTypes.object).isRequired,
        onRequestClose: PropTypes.func.isRequired,
    },

    mixins: [Translate],

    contextTypes: {
        d2: React.PropTypes.object.isRequired,
    },

    getInitialState() {
        return {
            updateStrategy: this.props.objects.length > 1 ? "merge" : "replace",
        };
    },

    componentWillMount() {
        orgUnitsActions.load(this.props.objects);
        this.disposable = orgUnitsStore.subscribe(({objects}) => {
            this.setState({objects})
        });
    },

    componentWillUnmount() {
        this.disposable && this.disposable.dispose();
    },

    _getTitle(objects, maxShown = 2) {
        const base = _(objects).take(maxShown).map("name").join(", ");

        if (objects.length <= maxShown) {
            return base;
        } else {
            return this.context.d2.i18n.getTranslation("this_and_n_others", {
                this: base,
                n: objects.length - maxShown,
            });
        }
    },

    _onChange(orgUnits) {
        orgUnitsActions.selectionChanged({orgUnits: orgUnits, strategy: this.state.updateStrategy});
    },

    _renderStrategyToggle() {
        if (this.state.objects && this.state.objects.length > 1) {
            const getTranslation = this.context.d2.i18n.getTranslation.bind(this.context.d2.i18n);
            const label = getTranslation('update_strategy') + ": " +
                getTranslation('update_strategy_' + this.state.updateStrategy);
 
            return (
                <Toggle
                    label={label}
                    checked={this.state.updateStrategy === "replace"}
                    onToggle={(ev, newValue) => this.setState({updateStrategy: newValue ? "replace" : "merge"})}
                />
            );
        } else {
            return null;
        }
    },

    _renderInner() {
        if (!this.state.objects) {
            return (<LoadingMask style={{position: 'relative'}} />);
        } else {
            const d2 = this.context.d2;
            const {objects} = this.state;
            const organisationUnits =
                _.intersectionBy(...objects.map(obj => obj.organisationUnits.toArray()), "id");
            const model = d2.models.dataSets.create({id: objects[0].id, organisationUnits});

            return (
                <div>
                    <Heading text={this._getTitle(objects)} level={2} />
                    {this._renderStrategyToggle()}

                    <OrganisationUnitTreeMultiSelect
                        modelDefinition={{plural: "dataSets"}}
                        model={model}
                        value={model.organisationUnits || []}
                        onChange={this._onChange}
                    />
                </div>
            );
        }
    },

    render() {
        const {objects: propObjects, ...dialogProps} = this.props;
        const dialogActions = [
            <FlatButton
                label={this.getTranslation('close')}
                onClick={this.closeDialog} />,
        ];

        return (
            <Dialog
                title={this.getTranslation('orgunits_settings')}
                actions={dialogActions}
                autoDetectWindowHeight
                autoScrollBodyContent
                {...dialogProps}
                onRequestClose={this.closeDialog}
            >
                {this._renderInner()}
            </Dialog>
        );
    },

    closeDialog() {
        this.props.onRequestClose(orgUnitsStore.getState());
    },
});
