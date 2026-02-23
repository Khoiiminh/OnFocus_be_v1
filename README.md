# OnFocus_be_v1
**OnFocus** is a cross-platform web application that centralizes user communications from external services such as **Gmail** and **LinkedIn** into a single, unified inbox experience.

OnFocus listens for **near-real-time mailbox and notification changes** from connected platforms and incrementally synchronizes new items into its own system. When a new email or notification arrives, OnFocus promptly detects the change, retrieves the necessary metadata (such as sender, subject, timestamp, and preview), and updates the user’s inbox view without requiring manual refresh.

Full message or notification content is fetched **on demand** when the user selects an item, ensuring fast inbox updates, efficient API usage, and scalable synchronization. 



- users
- external services ( service-based source in OnFocus - e.g., Gmail, LinkedIn )
- sessions auth-based
- connected accounts ( users' Gmail accounts, users' LinkedIn accounts )
- inbox 
- inbox content
