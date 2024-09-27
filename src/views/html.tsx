import path from "node:path";
import { readFileSync } from "node:fs";
import React, { Component } from "react";

interface HTMLProps {
    children: React.ReactNode;
}

const style = readFileSync(new URL(path.join(path.dirname(import.meta.url), "./style.css")), {
    encoding: "utf8",
});

export class Html extends Component<HTMLProps> {
    render() {
        return (
            <html lang="en-us">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <style dangerouslySetInnerHTML={{ __html: style }} />
                </head>
                <body>{this.props.children}</body>
            </html>
        );
    }
}
