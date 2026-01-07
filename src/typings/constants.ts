const Constants = {
    DROPDOWN_FETCH_SIZE: 150,
    EMAIL_TRIGGERS: [
        {
            label: 'General',
            options: [
                {
                    value: 'community_manager_invitation',
                    label: 'Inviting Community Manager'
                },
                {
                    value: 'community_host_invitation',
                    label: 'Inviting Community Instructor'
                },
                {
                    value: 'registration_welcome',
                    label: 'After Registration Welcome'
                },
                {
                    value: 'accept_transfer',
                    label: 'Accept Community Transfer'
                },
                {
                    value: 'reject_transfer',
                    label: 'Reject Community Transfer'
                }
            ]
        },
        {
            label: 'Reminders',
            options: [
                {
                    value: 'reminder_confirmation',
                    label: 'Reminder Confirmation'
                },
                {
                    value: 'host_reminder',
                    label: 'Instructor Event Reminder'
                },
                {
                    value: 'manager_reminder',
                    label: 'Admin/Manager Event Reminder'
                },
                {
                    value: 'member_reminder',
                    label: 'Member Event Reminder'
                },
                {
                    value: 'event_reschedule_updated',
                    label: 'Member Event Rescheduled [Reminder Updated]'
                },
                {
                    value: 'event_reschedule_removed',
                    label: 'Member Event Rescheduled [Reminder Removed]'
                }
            ]
        },
        {
            label: 'Event Cancelation',
            options: [
                {
                    value: 'host_not_started',
                    label: 'Instructor Not Started Event'
                },
                {
                    value: 'event_canceled',
                    label: 'Admin/Manger Event Canceled'
                },
                {
                    value: 'event_canceled_member',
                    label: 'Member Event Canceled'
                }
            ]
        }
    ],
    EMAIL_MERGE_TAGS: [
        {
            name: "Community Tags",
            mergeTags: [{
                name: "Name",
                value: "{{ community_name }}",
                sample: 'Community Name'
            }, {
                name: "Logo",
                value: "{{{ community_logo }}",
                sample: "Community Logo"
            }]
        },
        {
            name: "User Tags",
            mergeTags: [{
                name: "Full name",
                value: "{{ user_full_name }}"
            }, {
                name: "First name",
                value: "{{ user_first_name }}"
            }, {
                name: "Last name",
                value: "{{ user_last_name }}"
            }]
        },
        {
            name: "Event Tags",
            mergeTags: [{
                name: "Event Title",
                value: "{{ class_title }}",
            },{
                name: "Event Time",
                value: "{{ scheduled_class_for }}"
            },{
                name: "Event Link",
                value: "{{{ class_url }}"
            }]
        },
        {
            name: "Unsubscribe Link",
            value: "{{{ unsubscribe_link }}"
        }
    ],
    MANUAL_EMAIL_MERGE_TAGS: [{
        name: "Full name",
        value: "{{ user_full_name }}"
    }, {
        name: "First name",
        value: "{{ user_first_name }}",
    }, {
        name: "Last name",
        value: "{{ user_last_name }}",
    }]
}

export default Constants;