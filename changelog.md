# Televeda Admin changelog

## Format for the changelog
 - release date in `MMM-DD-YY` format 
 - version number in `X.X.X` format
    - for minor changes change the last number. Examples:
        - bug fix
        - cleanup of old code
        - package updates for the node libraries
    - for patch versions the middle one. Examples:
        - new functionality
        - updating existing functionality with new features
        - removing old functionality
    - for major version the first one. Examples: 
        - new breaking changes from the previous versions
        - removing / adding new features
 - commit messages for the release or just a summary of the deployed changes

## Release Oct-01-25
### Version 1.25.0
- Added R.A.D.A.R dashboard

## Release Sep-05-25
### Version 1.24.0
- Updated Metrics to support new user stats:
  - User retention
  - Churned users
  - Disengaged users
  - Repeat vs New attendees
- Added event/community aggregate for feedback widget in custom reports.

## Release Sep-05-25
### Version 1.23.0
- Added ability to automatically create on-demand events based on recordings.

## Release Aug-25-25
### Version 1.22.6
- Updated instructor icon selector.

## Release Aug-22-25
### Version 1.22.5
- Fixed on-demand template search

## Release Aug-18-25
### Version 1.22.4
- Updated feedback data for the VTC feedback

## Release Aug-18-25
### Version 1.22.3
- Removed custom class creation from host screen (linking to admin now).

## Release Aug-14-25
### Version 1.22.2
- Syncing user icon with profile.

## Release Aug-13-25
### Version 1.22.1
- Fixed groupBy date filters for the member analytics
- Removed some console logs

## Release Aug-13-25
### Version 1.22.0
- Updated General Analytics to include more info about community interactions
    - Added new views
    - Added more charts
    - Added more time statistics to the general summary
    - Removed the old table and charts view and combined them into a new unified one
- Moved the Resources page to the general analytics
- Moved the Sponsor page to the general analytics

## Release Jul-22-25
### Version 1.23.0
- Updated SSE endpoints

## Release Jul-22-25
### Version 1.22.0
- Added custom report feedback excel export.

## Release Jul-14-25
### Version 1.21.0
- Added PDF calendar.

## Release Jul-07-25
### Version 1.20.3
- TD-321 Editing Survey UX.
- TD-293 When Creating a Class Description, Small Clean Up.
- TD-341 Typos - Admin, Feedback.
- TD-296 Merge Tag for Class URL.

## Release Jul-07-25
### Version 1.20.2
- Cleanup for Streaming time analytics

## Release Jul-03-25
### Version 1.20.1
- Some minor cleanups for the analytics. ( chart height + "all" selector)

## Release Jul-02-25
### Version 1.20.0
- Custom reports v1.

## Release Jul-01-25
### Version 1.19.2
- Fixed retention chart not displaying the proper data
- Updated some of the labels
- Added an initial combined page time table for the analytics

## Release Jun-26-25
### Version 1.19.1
- Added a loading indicator for 2fa code generation
- Updated the labels and tooltips for the general analytics

## Release Jun-23-25
### Version 1.19.1
- Fixed the fetching of the summaries for the analytics

## Release Jun-19-25
### Version 1.19.0
- Updated analytics page to have a new tabs design for charts and tables
- Added new components for table analytics + reworked some of the old charts logic

## Release May-22-25
### Version 1.18.0
- made analytics for time spent on page and time spent in streaming
- updated the filters of the analytics

## Release Apr-16-25
### Version 1.17.1
- modified unit tests to handle meta.env

## Release Apr-16-25
### Version 1.17.0
- Added surveys localization.

## Release Apr-16-25
### Version 1.16.0
- Made notification templates to be able to be created for specific communities
- Also made them to be able to be deleted for specific communities

## Release Apr-11-25
### Version 1.15.0
- Added survey submissions exports.

## Release Apr-10-25
### Version 1.14.0
- Tests made for different components

## Release Apr-09-25
### Version 1.13.0
- Added survey submissions versioning.

## Release Apr-07-25
### Version 1.12.1
- Fixed redirects on refine-user set up

## Release Mar-31-25
### Version 1.12.0
- multiple community selection for analytics made

## Release Mar-27-25
### Version 1.11.0
- gave instructors ability to create/edit on demand classes
- fixed overflow when class name is too long during creation
- gave managers access to the notifications

## Release Mar-18-25
### Version 1.10.1
- fixed broken replacement tags for emails

## Release Mar-07-25
### Version 1.10.0
- creating and adding class categories to classess made

## Release Feb-27-25
### Version 1.9.1
- Added onlyHosted events filter, fixed permission issues.
- Miscellaneous fixes.
- Hid categories for now. 

## Release Feb-21-25
### Version 1.9.0
- Managers made to be able to see the profile of users in his community
- Added resources users history

## Release Feb-17-25
### Version 1.8.2
- 2FA setup cleanups.

## Release Feb-14-25
### Version 1.8.1
- Fixes regarding manager survey access.
- Fixed deletion on event for admin after instructor access update.

## Release Feb-07-25
### Version 1.8.0
- Added dynamic event categories.

## Release Feb-06-25
### Version 1.7.0
- Optmized community fetch, 
- Updated instructor access & some labels.
- Added error message when bingo cards are too much for Heroku...
- Made showing a table in the user profiles with resources and how they interacted with them
- Made showing a table with specific resources and how users interacted with them

## Release Jan-28-25
### Version 1.6.0
- Added instructor access to some resources.

## Release Jan-21-25
### Version 1.5.0
- ordering of public collections made

## Release Jan-17-25
### Version 1.4.1
- fixed closing dropdown when clicking outside
- added arrow icons next to the dropdown
 
## Release Jan-16-25
### Version 1.4.1
- Added in-person event type, adress field and labels for the data reporting.
- Added message prompt for popup block and retry option for exports.

## Release Jan-09-25
### Version 1.4.0
- Event exports are handled by the worker now. Set up ES connection for exports.

## Release Jan-07-25
### Version 1.3.0
- Added options to see collections from other comuunities and change their visibility

## Release Dec-15-25
### Version 1.3.0
- made navigation to host/lobby

## Release Dec-18-24
### Version 1.2.1
- Added public event export.

## Release Dec-13-24
### Version 1.2.0
- Added recommendations opt out for communities
- Updated rsvp analytics

## Release Dec-05-24
### Version 1.1.2
- made collections to have order

## Release Nov-21-24
### Version 1.1.1
- Fixed admin breaks when editing a recurring event with an end-on date - TD-175
- Facilitator feedback isn’t being saved properly on admin - TD-174
- Fixed survey redirects (part of TD-163)
- Fixed Image drop-down responsiveness in community collections - TD-170
- allowed cms to manually add members

## Release Nov-19-24
### Version 1.1.0
- Added invites codes logic. 
- Fixed resouces adapter.
- Updated the tab header
- Fixed adding a user manually on Admin
- Fixed user registration report lost details

## Release Nov-04-24
### Version 1.0.0
- Initial commit and setup with refine v4.
