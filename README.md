# CountMeUp

A REST service that accepts candidate votes data and partition choices sent to the server by candidate percentage

*Note: due to time constraint some functionality implementation is still in progress. The idea of the service is to continuously keeping track user votes
 count in a separate MongoDB collection and only store votes into the "vote" collection if the user hasn't voted more than allowed times and constantly updating the MongoDB
 database to reflect current voting status for each candidate.*
 
*Upon invoked the service will use MongoDB aggregation to generate candidate votes results from the vote collection that contains less than or equal to 3
votes from each user*

*The purpose of doing so is to make the tool more practical, since real time data is more likely to be processed as a steam*
 
*The original plan also includes building a kafka stream to simulate the process using
https://github.com/Blizzard/node-rdkafka from Blizzard.*

## prerequisite

This tools requires MongoDB to be install on your machine. Please consult relevant document for different the installation of MongoDB on different platform

## Usage

* For starting the server - ```npm start```
* For executing test - ```npm teset```
* Further improvement on automating and tooling can be made

## License

MIT