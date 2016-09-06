'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _tabs = require('material-ui/lib/tabs/tabs');

var _tabs2 = _interopRequireDefault(_tabs);

var _tab = require('material-ui/lib/tabs/tab');

var _tab2 = _interopRequireDefault(_tab);

var _ListSelect = require('../list-select/ListSelect.component');

var _ListSelect2 = _interopRequireDefault(_ListSelect);

var _selectField = require('material-ui/lib/select-field');

var _selectField2 = _interopRequireDefault(_selectField);

var _d = require('d2/lib/d2');

var _Translate = require('../i18n/Translate.mixin');

var _Translate2 = _interopRequireDefault(_Translate);

var _loglevel = require('loglevel');

var _loglevel2 = _interopRequireDefault(_loglevel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_d.config.i18n.strings.add('please_select_a_program');
_d.config.i18n.strings.add('no_tracked_entity_attributes');
_d.config.i18n.strings.add('no_program_indicators');
_d.config.i18n.strings.add('no_program_data_elements');

exports.default = _react2.default.createClass({
    displayName: 'ProgramOperandSelector',

    propTypes: {
        programOperandSelected: _react2.default.PropTypes.func.isRequired
    },

    mixins: [_Translate2.default],

    getInitialState: function getInitialState() {
        return {
            programTrackedEntityAttributeOptions: [],
            programIndicatorOptions: [],
            programDataElementOptions: [],
            programMenuItems: []
        };
    },
    componentDidMount: function componentDidMount() {
        var _this = this;

        this.context.d2.models.program.list({ paging: false, fields: 'id,displayName,programTrackedEntityAttributes[id,displayName,dimensionItem],programIndicators[id,displayName,dimensionItem]' }).then(function (programCollection) {
            return programCollection.toArray();
        }).then(function (programs) {
            var programMenuItems = programs.map(function (program) {
                return {
                    payload: program.id,
                    text: program.displayName
                };
            }).sort(function (left, right) {
                return left.text.localeCompare(right.text.toLowerCase());
            });

            _this.setState({
                programMenuItems: programMenuItems,
                programAttributes: new Map(programs.map(function (program) {
                    return [program.id, Array.from(program.programTrackedEntityAttributes.values()).map(function (tea) {
                        return {
                            value: tea.dimensionItem,
                            label: tea.displayName
                        };
                    }).sort(function (left, right) {
                        return left.label.toLowerCase().localeCompare(right.label.toLowerCase());
                    })];
                })),
                programIndicators: new Map(programs.map(function (program) {
                    return [program.id, Array.from(program.programIndicators.values()).map(function (pi) {
                        return {
                            value: pi.dimensionItem,
                            label: pi.displayName
                        };
                    }).sort(function (left, right) {
                        return left.label.toLowerCase().localeCompare(right.label.toLowerCase());
                    })];
                }))
            });
        }).catch(function (e) {
            return _loglevel2.default.error(e);
        });
    },
    renderTabs: function renderTabs() {
        var listStyle = { width: '100%', outline: 'none', border: 'none', padding: '0rem 1rem' };
        var noValueMessageStyle = {
            padding: '1rem'
        };

        return _react2.default.createElement(
            _tabs2.default,
            { tabItemContainerStyle: { backgroundColor: '#FFF' } },
            _react2.default.createElement(
                _tab2.default,
                { label: this.getTranslation('program_data_elements'), style: { color: '#333' } },
                !this.state.programDataElementOptions.length ? _react2.default.createElement(
                    'div',
                    { style: noValueMessageStyle },
                    this.getTranslation('no_program_data_elements')
                ) : _react2.default.createElement(_ListSelect2.default, { onItemDoubleClick: this._programDataElementSelected,
                    source: this.state.programDataElementOptions,
                    listStyle: listStyle,
                    size: '10'
                })
            ),
            _react2.default.createElement(
                _tab2.default,
                { label: this.getTranslation('program_tracked_entity_attributes'), style: { color: '#333' } },
                !this.state.programTrackedEntityAttributeOptions.length ? _react2.default.createElement(
                    'div',
                    { style: noValueMessageStyle },
                    this.getTranslation('no_tracked_entity_attributes')
                ) : _react2.default.createElement(_ListSelect2.default, { onItemDoubleClick: this._programTrackedEntityAttributeSelected,
                    source: this.state.programTrackedEntityAttributeOptions,
                    listStyle: listStyle,
                    size: '10'
                })
            ),
            _react2.default.createElement(
                _tab2.default,
                { label: this.getTranslation('program_indicators'), style: { color: '#333' } },
                !this.state.programIndicatorOptions.length ? _react2.default.createElement(
                    'div',
                    { style: noValueMessageStyle },
                    this.getTranslation('no_program_indicators')
                ) : _react2.default.createElement(_ListSelect2.default, { onItemDoubleClick: this._programIndicatorSelected,
                    source: this.state.programIndicatorOptions,
                    listStyle: listStyle,
                    size: '10'
                })
            )
        );
    },
    render: function render() {
        return _react2.default.createElement(
            'div',
            null,
            _react2.default.createElement(
                'div',
                { style: { margin: '0 1rem' } },
                _react2.default.createElement(_selectField2.default, { menuItems: this.state.programMenuItems,
                    onChange: this._loadProgramDataOperands,
                    value: this.state.selectedProgram,
                    hintText: this.getTranslation('please_select_a_program'),
                    fullWidth: true
                })
            ),
            this.state.selectedProgram ? this.renderTabs() : null
        );
    },
    _loadProgramDataOperands: function _loadProgramDataOperands(event, index, menuItem) {
        var _this2 = this;

        var programId = menuItem.payload;
        var api = this.context.d2.Api.getApi();

        api.get('programDataElements', { program: programId, fields: 'id,displayName,dimensionItem', paging: false, order: 'displayName:asc' }).then(function (programDataElements) {
            _this2.setState({
                selectedProgram: programId,
                programDataElementOptions: programDataElements.programDataElements.map(function (programDataElement) {
                    return { value: programDataElement.dimensionItem, label: programDataElement.displayName };
                }),
                programIndicatorOptions: _this2.state.programIndicators.get(programId) || [],
                programTrackedEntityAttributeOptions: _this2.state.programAttributes.get(programId) || []
            });
        }).catch(function (error) {
            return _loglevel2.default.error(error);
        });
    },
    _programTrackedEntityAttributeSelected: function _programTrackedEntityAttributeSelected(value) {
        var programTrackedEntityAttributeFormula = ['A{', value, '}'].join('');

        this.props.programOperandSelected(programTrackedEntityAttributeFormula);
    },
    _programIndicatorSelected: function _programIndicatorSelected(value) {
        var programIndicatorFormula = ['I{', value, '}'].join('');

        this.props.programOperandSelected(programIndicatorFormula);
    },
    _programDataElementSelected: function _programDataElementSelected(value) {
        var programDataElementSelected = ['D{', value, '}'].join('');

        this.props.programOperandSelected(programDataElementSelected);
    }
});