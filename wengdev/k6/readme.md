running command  
docker compose run --rm k6 run <path to file>

example
docker compose run --rm k6 run /scripts/load-test.js

running testing using shell script
./run-test.sh <path to file> 

run with output
./run-test.sh <path to file> <extentions>

example:
./run-test.sh /scripts/load-test.js csv
./run-test.sh /scripts/load-test.js json
./run-test.sh /scripts/load-test.js txt


