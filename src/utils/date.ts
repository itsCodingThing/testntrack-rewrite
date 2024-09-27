import datefns from "date-fns";

export function sortDates(dates: Date[], orderType: "acs" | "desc") {
    const list = [...dates];

    if (orderType === "acs") {
        return list.sort(datefns.compareAsc);
    }

    if (orderType === "desc") {
        return list.sort(datefns.compareDesc);
    }
}

export function getUTCTimestamp() {
    return datefns.getUnixTime(new Date());
}
