# ml_timeseries
Use machine learning to predict the next values in the timeseries.
With enough of the right input, future patterns can be predicted.

## Packaging
```docker build --tag docker.pkg.github.com/vraid-systems/ml_timeseries/main:`cat DOCKER_IMAGE_VERSION` .```

## Usage
Create model input data file from Quadency cryptocurrency average price API for listed cryptocurrencies:

`docker run --env CRYPTO=BTC/USD,ETH/USD --volume /local/path/to/api.json:/tmp/ml_timeseries/api.json docker.pkg.github.com/vraid-systems/ml_timeseries/main:2.0.0`


Create model input data file from Yahoo Finance stock ticker API for particular stock:

`docker run --env STOCK=JNJ --volume /local/path/to/api.json:/tmp/ml_timeseries/api.json docker.pkg.github.com/vraid-systems/ml_timeseries/main:2.0.0`


Train multi variable time series model against input data and output prediction of values in the original problem space:

`docker run --env MODEL=lstm --volume /local/path/to/api.json:/tmp/ml_timeseries/api.json --volume /local/path/to/prediction.json:/tmp/ml_timeseries/prediction.json docker.pkg.github.com/vraid-systems/ml_timeseries/main:2.0.0`

Note that `MODEL` can be `arima` or `lstm`.


Label the predicted features:

`docker run --env FEATURE_LABELS=BTC/USD,ETH/USD --volume /local/path/to/prediction.json:/tmp/ml_timeseries/prediction.json --volume /local/path/to/labeled.json:/tmp/ml_timeseries/labeled.json docker.pkg.github.com/vraid-systems/ml_timeseries/main:2.0.0`
