import React from "react";
import Sections from "./Sections.component";

const excludeErrors = ["core_competency_no_items"];

const CoreSections = props => <Sections {...props} type="core" excludeErrors={excludeErrors} />;

export default CoreSections;
