# Organizer trust and simple posting

The product rule is one-time representative verification, followed by lightweight event review. Uploading an image or pasting an email remains the normal input flow. A submission is never automatically a public event.

## Implemented in this version

- Original layout and typography retained, USC Cardinal `#990000`, restrained USC Gold accents and softened near-white warm surfaces. Brand colors: https://identity.usc.edu/identity/color/.
- A collapsed one-time organization application supports student clubs, USC departments, external companies and community organizations.
- `/api/organization-claims` validates and saves applications to SQLite/D1 with `pending_review`. Request JSON cannot create a verified identity, publishing entitlement or public event. The receipt is not an approval and does not send an email challenge.
- Posters, pasted emails and structured event submissions continue to enter private review storage. None of those routes publishes into the public recommendation pool.
- Event cards separate organization type, original listing provenance and attendance eligibility. A source badge requires an exact allowlisted platform hostname and matching imported source. It does not authenticate the person submitting content.

## Production verification workflow

1. Confirm a real organization and current status. Student clubs require the current organization directory/recognition record; a historical entry alone is insufficient. Departments require the relevant university directory. External brands require an independently checked business/brand presence.
2. Confirm the representative's authority. Send a challenge to the independently obtained organization officer/contact or corporate address, or obtain approval from an already verified organization administrator. Owning a USC email proves neither current club recognition nor officer authority. Owning a company email does not prove permission to represent every brand or run a campus activation.
3. Establish a scoped, expiring organization role in a server-authenticated account. Separate student affiliation, email ownership, officer authority and campus recognition. Recheck at role turnover/expiry and revoke access when the person leaves. Never derive approval from browser local storage, a pasted URL or an AI response.
4. For each event, match the existing poster/email against its authorized organizer and original announcement. Check date, venue, registration, admission restrictions, duplicates and contradictions. AI may extract details and flag problems; it does not certify authenticity. Changes to sensitive details trigger another check.
5. Publish only after the server confirms both organization authority and the event review result. Show what was checked, the source and check date; distinguish verified organization authority from university recognition or sponsorship. Provide reporting, unpublishing and an audit trail.

## External brands at USC Village / Jefferson

Use `External brand / company`, not `USC department`. Verify the business and the authorized contact once. For an activation, check the original brand/host announcement, exact location and venue/host authorization where required. A location near campus does not demonstrate USC affiliation or sponsorship. Do not assume that all spaces have the same owner or permission process.

Free admission, free food and free samples are separate factual claims. Only show a confirmed perk when its source supports it; retain quantity limits, purchase/membership requirements and age restrictions. Recommend only against the saved attendee eligibility information and announced rules.

## Integrations still needed

Server-authenticated organizer accounts, independent email challenges, organization/venue review operations, current recognition records, approved roles, moderation decisions, expiry/revocation and a production publishing endpoint are not connected in this preview. Applications remain pending. USC SSO, even when connected, will not by itself establish organization authority.

The product must not promise that verification guarantees an event will happen, capacity remains available or every false claim will be caught.
