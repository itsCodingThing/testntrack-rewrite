import React from "react";
import lodash from "lodash";
import { Html } from "./html.js";

interface IQuestion {
    _id: string;
    board: string;
    class: string;
    subject: string;
    chapter: string;
    topics: string[];
    category: string;
    question_type: string;
    swat: string[];
    level: string;
    marks: number;
    locale: string;
    status: boolean;
    question: string;
    solution: string;
    options: { option_text: string; correct: boolean; _id: string }[];
}

interface IQuestionSection {
    question: IQuestion[][];
}

interface ISection {
    sectionName: string;
    sectionTotalMarks: number;
    sectionTotalTime: string;
    questions: IQuestionSection[];
}

interface PaperProps {
    schoolName: string;
    schoolAddress: string;
    academicSession: string;
    paperName: string;
    totalTime: string;
    totalMarks: string;
    className: string;
    subject: string;
    instructions: string[];
    sections: ISection[];
}

function PaperHeader(props: { details: Omit<PaperProps, "sections"> }) {
    return (
        <header>
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                }}
            >
                <h3>{props.details.schoolName}</h3>
                <h3>{props.details.schoolAddress}</h3>
                <h3>{props.details.academicSession}</h3>
            </div>

            <div className="header_section">
                <div></div>
                <div>
                    <h3>Date ...................... </h3>
                </div>
            </div>

            <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>{props.details.paperName}</h2>

            <div className="orange_container">
                <div className="header_section">
                    <h3>Total Time: {props.details.totalTime} min</h3>
                    <h3>Max. Marks: {props.details.totalMarks}</h3>
                </div>

                <hr className="divider" />

                <div className="instruction">
                    <h3>General instruction:</h3>
                    <ul style={{ paddingLeft: "1rem" }}>
                        {props.details.instructions.map((instruction, index) => {
                            return <li key={index}>{instruction}</li>;
                        })}
                    </ul>
                </div>
            </div>

            <div className="header_section">
                <h3>Class: {props.details.className}</h3>
                <h3>Subject: {props.details.subject} </h3>
            </div>
        </header>
    );
}

function PaperSection(props: { paperSectionName: string; children: React.ReactNode }) {
    return (
        <section style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <h2>{props.paperSectionName}</h2>
            {props.children}
        </section>
    );
}

export default function PaperPage(props: PaperProps) {
    let questionCounter = 0;

    return (
        <Html>
            <main className="container">
                <PaperHeader details={lodash.omit(props, "sections")} />
                {props.sections.map((section, sectionIndex) => {
                    return (
                        <PaperSection key={sectionIndex} paperSectionName={section.sectionName}>
                            {section.questions.map((questionSections, questionSectionsIndex) => {
                                const marks = questionSections.question[0][0].marks;
                                questionCounter = questionCounter + 1;

                                return (
                                    <div className="question_section" key={questionSectionsIndex}>
                                        <div className="question_number">
                                            <strong>Q:{questionCounter}</strong>
                                        </div>

                                        <div className="question_container">
                                            {questionSections.question.map((qs, index) => {
                                                return (
                                                    <React.Fragment key={index}>
                                                        {qs.map((q, qi) => {
                                                            return (
                                                                <div
                                                                    className="question_innercontainer"
                                                                    key={qi}
                                                                    dangerouslySetInnerHTML={{
                                                                        // __html: q.question,
                                                                        __html: q.question.replace(/\s+/g, " ").trim(),
                                                                        // __html: q.question
                                                                        //     .replace(/(\r\n|\n|\r)/gm, " ")
                                                                        //     .trim(),
                                                                    }}
                                                                ></div>
                                                            );
                                                        })}
                                                        {questionSections.question.length !== index + 1 ? (
                                                            <div style={{ textAlign: "center", marginTop: "2rem" }}>
                                                                <h2>or</h2>
                                                            </div>
                                                        ) : null}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>

                                        <div className="question_marks">
                                            <strong>{marks}</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </PaperSection>
                    );
                })}
            </main>
        </Html>
    );
}
