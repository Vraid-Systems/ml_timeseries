# ml_timeseries
Use machine learning to predict the next values in the timeseries.
With enough of the right input, future patterns can be predicted.

## Packaging
```docker build --tag docker.pkg.github.com/vraid-systems/ml_timeseries/main:`cat DOCKER_IMAGE_VERSION` .```

## Usage
Create predictions from [Quadency cryptocurrency average price API](https://quadency.com/developer/#list-historical-average-prices) for listed cryptocurrencies:

`docker run --env CRYPTO=BTC/USD,ETH/USD --env MODEL=arima --volume /local/path/to/prediction.json:/tmp/ml_timeseries/prediction.json docker.pkg.github.com/vraid-systems/ml_timeseries/main:3.0.0`

Create prediction from Yahoo Finance stock ticker API for particular stock:

`docker run --env MODEL=lstm --env STOCK=JNJ /local/path/to/prediction.json:/tmp/ml_timeseries/prediction.json docker.pkg.github.com/vraid-systems/ml_timeseries/main:2.0.0`

Note that `MODEL` can be `arima` or `lstm`.
