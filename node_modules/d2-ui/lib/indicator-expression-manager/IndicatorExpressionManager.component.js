'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ExpressionDescription = require('./ExpressionDescription.component');

var _ExpressionDescription2 = _interopRequireDefault(_ExpressionDescription);

var _ExpressionOperators = require('./ExpressionOperators.component');

var _ExpressionOperators2 = _interopRequireDefault(_ExpressionOperators);

var _ExpressionFormula = require('./ExpressionFormula.component');

var _ExpressionFormula2 = _interopRequireDefault(_ExpressionFormula);

var _DataElementOperandSelector = require('./DataElementOperandSelector.component');

var _DataElementOperandSelector2 = _interopRequireDefault(_DataElementOperandSelector);

var _tabs = require('material-ui/lib/tabs/tabs');

var _tabs2 = _interopRequireDefault(_tabs);

var _tab = require('material-ui/lib/tabs/tab');

var _tab2 = _interopRequireDefault(_tab);

var _paper = require('material-ui/lib/paper');

var _paper2 = _interopRequireDefault(_paper);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _d = require('d2/lib/d2');

var _ProgramOperandSelector = require('./ProgramOperandSelector');

var _ProgramOperandSelector2 = _interopRequireDefault(_ProgramOperandSelector);

var _Heading = require('../headings/Heading.component');

var _Heading2 = _interopRequireDefault(_Heading);

var _OrganisationUnitGroupSelector = require('./OrganisationUnitGroupSelector.component');

var _OrganisationUnitGroupSelector2 = _interopRequireDefault(_OrganisationUnitGroupSelector);

var _ConstantSelector = require('./ConstantSelector.component');

var _ConstantSelector2 = _interopRequireDefault(_ConstantSelector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('data_elements');
_d.config.i18n.strings.add('description');
_d.config.i18n.strings.add('organisation_unit_counts');
_d.config.i18n.strings.add('program_tracked_entity_attributes');
_d.config.i18n.strings.add('program_indicators');
_d.config.i18n.strings.add('program_data_elements');
_d.config.i18n.strings.add('constants');
_d.config.i18n.strings.add('this_field_is_required');
_d.config.i18n.strings.add('programs');

/**
 * @component IndicatorExpressionManager
 *
 * @description
 * Component to manage the indicator expressions. Either numerator or denominator.
 *
 * This component require an `expressionStatusActions` object that contains the following actions.
 * - `requestExpressionStatus`
 *
 * The `requestExpressionStatus` action gets fired each time the expression is changed.
 * In case of `d2-flux` we suggest you implement the action handler somewhat like the following.
 * ```js
    import Action from 'd2-flux/action/Action';
    import indicatorExpressionStatusStore from './indicatorExpressionStatus.store';

    const indicatorExpressionStatusActions = Action.createActionsFromNames(['requestExpressionStatus']);

    indicatorExpressionStatusActions.requestExpressionStatus
        .throttle(500)
        .map(action => {
            const encodedFormula =  encodeURIComponent(action.data);
            const url = `/api/expressions/description?expression=${encodedFormula}`;

            return Observable.fromPromise(api.request(url));
        })
        .concatAll()
        .subscribe(action => {
            .then(function () {
                indicatorExpressionStatusStore.setState(tempResponse);
            });
        });

    export default indicatorExpressionStatusActions;

 * ```
 */
var IndicatorExpressionManager = _react2.default.createClass({
    displayName: 'IndicatorExpressionManager',

    propTypes: {
        descriptionLabel: _react2.default.PropTypes.string.isRequired,
        organisationUnitGroupOptions: _react2.default.PropTypes.array.isRequired,
        constantOptions: _react2.default.PropTypes.array.isRequired,
        programTrackedEntityAttributeOptions: _react2.default.PropTypes.array.isRequired,
        expressionStatusActions: _react2.default.PropTypes.object.isRequired,
        expressionStatusStore: _react2.default.PropTypes.object.isRequired,
        indicatorExpressionChanged: _react2.default.PropTypes.func.isRequired,
        dataElementOperandSelectorActions: _react2.default.PropTypes.object.isRequired,
        descriptionValue: _react2.default.PropTypes.string.isRequired,
        formulaValue: _react2.default.PropTypes.string.isRequired,
        titleText: _react2.default.PropTypes.string.isRequired
    },

    mixins: [_Translate2.default],

    getDefaultProps: function getDefaultProps() {
        return {
            organisationUnitGroupOptions: [],
            constantOptions: [],
            programTrackedEntityAttributeOptions: []
        };
    },
    getInitialState: function getInitialState() {
        return {
            formula: this.props.formulaValue,
            description: this.props.descriptionValue,
            expressionStatus: {
                description: '',
                isValid: false
            }
        };
    },
    componentWillMount: function componentWillMount() {
        var _this = this;

        if (!this.props.expressionStatusStore) {
            return true;
        }

        var first = true;

        this.disposable = this.props.expressionStatusStore.subscribe(function (expressionStatus) {
            _this.setState({
                expressionStatus: {
                    description: expressionStatus.description,
                    isValid: expressionStatus.status === 'OK',
                    message: expressionStatus.message
                }
            }, function () {
                if (first) {
                    first = false;
                    return;
                }

                _this.props.indicatorExpressionChanged({
                    formula: _this.state.formula,
                    description: _this.state.description,
                    expressionStatus: _this.state.expressionStatus
                });
            });
        }, function (error) {
            return _loglevel2.default.error(error);
        });

        if (this.props.formulaValue.trim()) {
            this.requestExpressionStatus();
        }
    },
    componentWillUnmount: function componentWillUnmount() {
        this.disposable && this.disposable.dispose();
    },
    render: function render() {
        var _this2 = this;

        var listStyle = { width: '100%', outline: 'none', border: 'none', padding: '0rem 1rem' };

        var statusMessageClasses = (0, _classnames2.default)('indicator-expression-manager__readable-expression__message', {
            'indicator-expression-manager__readable-expression__message--valid': this.state.expressionStatus.isValid,
            'indicator-expression-manager__readable-expression__message--invalid': !this.state.expressionStatus.isValid
        });

        var isDescriptionValid = function isDescriptionValid() {
            return _this2.state.description && _this2.state.description.trim();
        };

        return _react2.default.createElement(
            'div',
            { className: 'indicator-expression-manager' },
            _react2.default.createElement(_Heading2.default, { style: { margin: 0, padding: '2rem 2rem 1rem' }, level: 3, text: this.props.titleText }),
            _react2.default.createElement(
                'div',
                { className: 'indicator-expression-manager__left', style: { paddingLeft: '2rem' } },
                _react2.default.createElement(
                    _paper2.default,
                    { style: { padding: '0 2rem', marginTop: '1rem', minHeight: 395 } },
                    _react2.default.createElement(
                        'div',
                        { className: 'indicator-expression-manager__description' },
                        _react2.default.createElement(_ExpressionDescription2.default, { descriptionValue: this.state.description,
                            descriptionLabel: this.getTranslation('description'),
                            onDescriptionChange: this.descriptionChange,
                            errorText: !isDescriptionValid() ? this.getTranslation('this_field_is_required') : undefined,
                            onBlur: this.requestExpressionStatus
                        })
                    ),
                    _react2.default.createElement(_ExpressionFormula2.default, { onFormulaChange: this.formulaChange,
                        formula: this.state.formula }),
                    _react2.default.createElement(_ExpressionOperators2.default, { operatorClicked: this.addOperatorToFormula })
                )
            ),
            _react2.default.createElement(
                'div',
                { className: 'indicator-expression-manager__right', style: { paddingRight: '2rem' } },
                _react2.default.createElement(
                    _paper2.default,
                    { style: { padding: '0 0rem', marginTop: '1rem', minHeight: 395 } },
                    _react2.default.createElement(
                        _tabs2.default,
                        null,
                        _react2.default.createElement(
                            _tab2.default,
                            { label: this.getTranslation('data_elements') },
                            _react2.default.createElement(_DataElementOperandSelector2.default, { onItemDoubleClick: this.dataElementOperandSelected,
                                dataElementOperandSelectorActions: this.props.dataElementOperandSelectorActions,
                                listStyle: listStyle
                            })
                        ),
                        _react2.default.createElement(
                            _tab2.default,
                            { label: this.getTranslation('programs') },
                            _react2.default.createElement(_ProgramOperandSelector2.default, { programOperandSelected: this.programOperandSelected })
                        ),
                        _react2.default.createElement(
                            _tab2.default,
                            { label: this.getTranslation('organisation_unit_counts') },
                            _react2.default.createElement(_OrganisationUnitGroupSelector2.default, { onItemDoubleClick: this.organisationUnitGroupSelected,
                                source: this.props.organisationUnitGroupOptions,
                                listStyle: listStyle
                            })
                        ),
                        _react2.default.createElement(
                            _tab2.default,
                            { label: this.getTranslation('constants') },
                            _react2.default.createElement(_ConstantSelector2.default, { onItemDoubleClick: this.constantSelected,
                                source: this.props.constantOptions,
                                listStyle: listStyle
                            })
                        )
                    )
                )
            ),
            _react2.default.createElement(
                'div',
                { className: 'indicator-expression-manager__readable-expression', style: { paddingLeft: '2rem', paddingRight: '2rem' } },
                _react2.default.createElement(
                    _paper2.default,
                    null,
                    this.state.expressionStatus.description
                ),
                _react2.default.createElement(
                    'div',
                    { className: statusMessageClasses },
                    this.state.expressionStatus.message
                )
            )
        );
    },
    descriptionChange: function descriptionChange(newDescription) {
        var _this3 = this;

        this.setState({
            description: newDescription
        }, function () {
            _this3.props.indicatorExpressionChanged({
                formula: _this3.state.formula,
                description: _this3.state.description,
                expressionStatus: _this3.state.expressionStatus
            });
        });
    },
    formulaChange: function formulaChange(newFormula) {
        var _this4 = this;

        this.setState({
            formula: newFormula
        }, function () {
            _this4.requestExpressionStatus();
        });
    },
    addOperatorToFormula: function addOperatorToFormula(operator) {
        this.appendToFormula(operator);
    },
    organisationUnitGroupSelected: function organisationUnitGroupSelected(value) {
        var ougFormula = ['OUG{', value, '}'].join('');

        this.appendToFormula(ougFormula);
    },
    constantSelected: function constantSelected(value) {
        var constFormula = ['C{', value, '}'].join('');

        this.appendToFormula(constFormula);
    },
    programOperandSelected: function programOperandSelected(programFormulaPart) {
        this.appendToFormula(programFormulaPart);
    },
    appendToFormula: function appendToFormula(partToAppend) {
        var _this5 = this;

        this.setState({
            formula: [this.state.formula, partToAppend].join('')
        }, function () {
            _this5.requestExpressionStatus();
        });
    },
    dataElementOperandSelected: function dataElementOperandSelected(dataElementOperandId) {
        var dataElementOperandFormula = ['#{', dataElementOperandId, '}'].join('');

        this.appendToFormula(dataElementOperandFormula);
    },
    requestExpressionStatus: function requestExpressionStatus() {
        this.props.expressionStatusActions.requestExpressionStatus(this.state.formula);
    }
});

exports.default = IndicatorExpressionManager;