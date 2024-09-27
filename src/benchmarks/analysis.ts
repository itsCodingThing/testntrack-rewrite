import autocannon from "autocannon";

const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyZmNhNjYxZWIwZWE4ZTVkZjE1MWJiYSIsInNjaG9vbCI6IjYyZjBkYWU5Y2M1OGNjMWY0MzZlMzg1YiIsInR5cGUiOiJ0ZWFjaGVyIiwiaWF0IjoxNjg0MjI4NjE1LCJleHAiOjE2ODY4MjA2MTV9.vj8pbmDMUWSB2Dr7ZKqffEEHfuYp4qY7ofQybFuDMQk";
const url = "http://localhost:" + 8080;
const paperId = "631d478b0b8e329203f59450";

autocannon(
    {
        url,
        connections: 10000,
        duration: 10,
        headers: {
            authorization: `Bearer ${token}`,
        },
        requests: [
            {
                method: "GET",
                path: `/api/v1/teacher/paper/${paperId}/gap-analysis`,
            },
        ],
    },
    (err, res) => {
        if (err) {
            console.log("finished bench", err);
        } else {
            console.log(res);
        }
    }
);
