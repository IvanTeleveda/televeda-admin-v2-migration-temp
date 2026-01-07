import { EventTypes } from "./enums";

export function getEventLabel(value: EventTypes, isLoading: boolean) {
    let label: string = !isLoading ? "unidentified" : "...";
    
    switch (value) {
        case EventTypes.LOCAL: label = "Televeda Live Streaming"; break;
        case EventTypes.VTC: label = "VTC"; break;
        case EventTypes.EMBEDDED: label = "On-demand Video Embed - old"; break;
        case EventTypes.ON_DEMAND: label = "On-demand Video Embed"; break;
        case EventTypes.EXTERNAL: label = "External Video"; break
        case EventTypes.TELEVEDA_BINGO: label = "Televeda Bingo Game"; break;
        case EventTypes.WEBEX: label = "External Video - Webex"; break;
        case EventTypes.IN_PERSON: label = "In Person Event"; break;
    }

    return label;
}