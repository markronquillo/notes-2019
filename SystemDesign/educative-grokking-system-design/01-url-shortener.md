# Designing a URL Shortening service like TinyURL

## 1. Why do we need URL Shortening? 

## 2. Requirements and Goals of the system

Our URL Shortening system should meet the following requirements

### Functional Requirements:
1. Given a URL our service should generate a shorter and unique alias of it. This is called a short link.
2. When users access a short link, our service should redirect them to the original link.
3. Users should optionally be able to pick a custom short link for their URL.
4. Links will expire after a standard default timespan. Users should also be able to specify the expiration time.

### Non-Functional Requirements:
1. The system should be highly available. This is required because, if our service is down, all the URL redirections will start failing.
2. URL redirection should happen in real-time with minimal latency.
3. Shortened links should not be guessable (not predictable).

### Extended Requirements:
1. Analytics; e.g. how many times a redirection happened?
2. Our service should also be accessible through REST APIs by other services.
3. Capacity Estimation and Constraints

Our system will be read heavy. There will be lots of redirection requests compared to new URL shortenings. Let's assume 100:1 ration between read and write.

**Traffic estimates**: if we assume we will have 500M new URL shortenings per month, we can expect (100 * 500M => 50B) redirections during that same period. What would be Queries Per Second (QPS) for our system?

New URLs shortening per second:

500 million / (30 days * 24 hours * 3600 seconds) = ~200 URLs/s

URL redirections per second, considering 100:1 read/write ratio:

50 billion / (30 days * 24 hours * 3600 seconds) = ~19K/s

**Storage estimates**: Let's assume we store every URL shortening request( and associated shortened link)  for 5 years. Since we expect to ahve 500 M new URLs every month, the total number of objects we expect to store will be 30 billion:

500 million * 5 years * 12 months = 30 billion

Let's assume that each stored object will be approximately 500 bytes (ballpark estimate). We will need 15TB of total storage.

**Bandwidth estimates**: For write requests, since we expect 200 new URLs every second, total incoming data for our service will be 100KB per second.

200 * 500 bytes = 100KB/s

For read requests, since every second we expect ~19K URLs redirections, total outgoing data for our service would be 9MB per second.

19K * 500 bytes = ~9MB/s

**Memory estimates**: If we wnat to cache some of the hot URLs that are frequently accessed, how much memory will we need to store them? If we follow the 80-20 rule, meaning 20% of URLs generate 80% of traffic, we would like ot cache these 20% hot URLs

Since we have 19K requests per second, we will be getting 1.7 billion requests per day:

19K * 3600s * 24h = ~17.billion

To cache 20% of these requets we will need 170GB of memoryA

**High level estimates**: Assuming 50 million new URLs per month and 100:1 read:write ratio, following is the summary of the high level estimates for our service:

| New URLs            | 200/s    |
| ------------------- | -------- |
| URL redirections    | 19 K/s   |
| Incoming data       | 100 KB/s |
| Outgoing data       | 9MB/s    |
| Storage for 5 years | 15TB     |
| Memory for cache    | 170 GB   |

4. System APIs
`createURL(api_dev_key, original_url, custom_alias=None, user_name=None, expire_date=None)`
`deleteURL(api_dev_key, url_key)`

5. Database Design

- Use NOSQL, dynamo or cassandra perhaps

6. Basic System Design and Algorithm

How to generate a short and unique key for a given URL?

a) Encoding actual URL
- We can compute a unique hash of the given URL. The hash can then be encoded for displaying. This encoding could be base36([a-z, 0-9]) or base62([A-Z, a-z, 0-9]) and if we add '-' and '.' we can use base64 encoding. A reasonable question would be: what should be the length of the short key?

- Using base64 encoding, a 6 letter long key would result in 64^6 = ~68.7 billion possible strings
- Using base64 encoding, a 8 letter long key would result in 64^8 = ~281 trillion possible strings
  
`The reason why 64^6 (for 6 letters) is that the possible characters per position is 64 and we have 6 positions, basically 64 * 64 * 64 * 64 * 64 * 64`

b) Generating keys offline

We can have a standalone key generation service (KGS) that generates random six letter strings beforehand and stores them in a database (key-DB). Whenever we want to shorted a URL, we will just take one of the already-generated keys and use it. This approach will make thigns quite simple and fast. Not only are we not encoding the URL, but we weon't have to worry about duplications or collisions. 

Servers can use KGS to read/mark keys in the database. KGS can use two tables to store keys: one for keys that are not used yet, and one for all the used keys. As soon as KGS gives keys to one of the servers, it can move them to the used keys table. KGS can always keep some keys in memory so that it can quickly provide them whenever a server needs them.

For simplicity, as soon as KGS loads some keys in memory, it can move them to the used keys table. This ensures each server gets unique keys. If KGS dies before assigning all the loaded keys to some server, we will be wasting those keys–which is acceptable, given the huge number of keys we have.

KGS also has to make sure not to give the same key to multiple servers. For that, it must synchronize (or get a lock to) the data structure holding the keys before removing keys from it and giving them to a server

**What would be the key-DB size?** With base64 encoding, we can generate 68.7B unique six letters keys. If we need one byte to store one alpha-numeric character, we can store all these keys in:

6 (characters per key) * 68.7B (unique keys) = 412 GB.

**Isn’t KGS the single point of failure?** Yes, it is. To solve this, we can have a standby replica of KGS. Whenever the primary server dies, the standby server can take over to generate and provide keys.

**Can each app server cache some keys from key-DB?** Yes, this can surely speed things up. Although in this case, if the application server dies before consuming all the keys, we will end up losing those keys. This could be acceptable since we have 68B unique six letter keys.

**How would we perform a key lookup?** We can look up the key in our database or key-value store to get the full URL. If it’s present, issue an “HTTP 302 Redirect” status back to the browser, passing the stored URL in the “Location” field of the request. If that key is not present in our system, issue an “HTTP 404 Not Found” status, or redirect the user back to the homepage.

**Should we impose size limits on custom aliases?** Our service supports custom aliases. Users can pick any ‘key’ they like, but providing a custom alias is not mandatory. However, it is reasonable (and often desirable) to impose a size limit on a custom alias to ensure we have a consistent URL database. Let’s assume users can specify a maximum of 16 characters per customer key (as reflected in the above database schema).

7. Data Partitioning and Replication

To scale out our DB, we need to partition it so that it can store information about billions of URLs. We need to come up with a partitioning scheme that would divide and store our data to different DB servers.

**a. Range Based Partitioning:** We can store URLs in separate partitions based on the first letter of the URL or the hash key. Hence we save all the URLs starting with letter ‘A’ in one partition, save those that start with letter ‘B’ in another partition and so on. This approach is called range-based partitioning. We can even combine certain less frequently occurring letters into one database partition. We should come up with a static partitioning scheme so that we can always store/find a file in a predictable manner.

The main problem with this approach is that it can lead to unbalanced servers. For example: we decide to put all URLs starting with letter ‘E’ into a DB partition, but later we realize that we have too many URLs that start with letter ‘E’.

**b. Hash-Based Partitioning:** In this scheme, we take a hash of the object we are storing. We then calculate which partition to use based upon the hash. In our case, we can take the hash of the ‘key’ or the actual URL to determine the partition in which we store the data object.

Our hashing function will randomly distribute URLs into different partitions (e.g., our hashing function can always map any key to a number between [1…256]), and this number would represent the partition in which we store our object.

This approach can still lead to overloaded partitions, which can be solved by using Consistent Hashing

8. Cache

We can cache URLs that are frequently accessed. We can use some off-the-shelf solution like Memcache, which can store full URLs with their respective hashes. The application servers, before hitting backend storage, can quickly check if the cache has the desired URL.

**How much cache should we have?** We can start with 20% of daily traffic and, based on clients’ usage pattern, we can adjust how many cache servers we need. As estimated above, we need 170GB memory to cache 20% of daily traffic. Since a modern day server can have 256GB memory, we can easily fit all the cache into one machine. Alternatively, we can use a couple of smaller servers to store all these hot URLs.

**Which cache eviction policy would best fit our needs?** When the cache is full, and we want to replace a link with a newer/hotter URL, how would we choose? Least Recently Used (LRU) can be a reasonable policy for our system. Under this policy, we discard the least recently used URL first. We can use a Linked Hash Map or a similar data structure to store our URLs and Hashes, which will also keep track of which URLs are accessed recently.

To further increase the efficiency, we can replicate our caching servers to distribute load between them.

**How can each cache replica be updated?** Whenever there is a cache miss, our servers would be hitting a backend database. Whenever this happens, we can update the cache and pass the new entry to all the cache replicas. Each replica can update their cache by adding the new entry. If a replica already has that entry, it can simply ignore it.


9. Load Balancer (LB)

We can add a Load Balancing layer at three places in our system

a. Between Clients and Application servers
b. Between Application Servers and database servers
c. Between Aplication Servers and Cache servers

Initially, we could use a simple Round Robin approach that distributes incoming requests equally among backend servers. This LB is simple to implement and does not introduce any overhead. Another benefit of this approach is, if a server is dead, LB will take it out of the rotation and will stop sending any traffic to it.

A problem with Round Robin LB is that server load is not taken into consideration. If a server is overloaded or slow, the LB will not stop sending new requests to that server. To handle this, a more intelligent LB solution can be placed that periodically queries the backend server about its load and adjusts traffic based on that.


10. Purging or DB Cleanup

Should entries stick around forever or should they be purged? If a user-specified expiration time is reached, what should happen to the link?

If we chose to actively search for expired links to remove them, it would put a lot of pressure on our database. Instead, we can slowly remove expired links and do a lazy cleanup. Our service will make sure that only expired links will be deleted, although some expired links can live longer but will never be returned to users.

- Whenever a user tries to access an expired link, we can delete the link and return an error to the user.
- A separate Cleanup service can run periodically to remove expired links from our storage and cache. This service should be very lightweight and can be scheduled to run only when the user traffic is expected to be low.
- We can have a default expiration time for each link (e.g., two years).
- After removing an expired link, we can put the key back in the key-DB to be reused.
- Should we remove links that haven’t been visited in some length of time, say six months? This could be tricky. Since storage is getting cheap, we can decide to keep links forever.

11. Telemetry

How many times a short URL has been used, what were user locations, etc.? How would we store these statistics? If it is part of a DB row that gets updated on each view, what will happen when a popular URL is slammed with a large number of concurrent requests?

Some statistics worth tracking: country of the visitor, date and time of access, web page that refers the click, browser or platform from where the page was accessed.

12. Security and Permissions

Can users create private URLs or allow a particular set of users to access a URL?

We can store permission level (public/private) with each URL in the database. We can also create a separate table to store UserIDs that have permission to see a specific URL. If a user does not have permission and tries to access a URL, we can send an error (HTTP 401) back. Given that we are storing our data in a NoSQL wide-column database like Cassandra, the key for the table storing permissions would be the ‘Hash’ (or the KGS generated ‘key’). The columns will store the UserIDs of those users that have permissions to see the URL.