import React, { Component } from "react";
import { Observable } from "rx";
import DetailsBox from "./DetailsBox.component";
import Paper from "material-ui/Paper";

export default class DetailsBoxWithScroll extends Component {
    componentDidMount() {
        this.disposable = Observable.fromEvent(global, "scroll")
            .debounce(200)
            .subscribe(() => this.props.scroll && this.forceUpdate());
    }

    componentWillUnmount() {
        this.disposable && this.disposable.dispose();
    }

    render() {
        let marginTop;
        if (this.props.scroll) {
            const appOffsetTop = document.querySelector("main").offsetTop;
            marginTop = Math.max(document.scrollingElement.scrollTop - appOffsetTop, 0);
        } else {
            marginTop = 0;
        }

        return (
            <div style={this.props.style}>
                <Paper
                    zDepth={1}
                    rounded={false}
                    style={{ maxWidth: 500, minWidth: 300, marginTop }}
                >
                    <DetailsBox
                        source={this.props.detailsObject}
                        showDetailBox={!!this.props.detailsObject}
                        onClose={this.props.onClose}
                        config={this.props.config}
                    />
                </Paper>
            </div>
        );
    }
}
