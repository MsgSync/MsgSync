module github.com/MsgSync/MsgSync/services/ss7-gateway

go 1.25.4

replace github.com/MsgSync/MsgSync/services/common => ../common

require github.com/MsgSync/MsgSync/services/common v0.0.0-00010101000000-000000000000

require (
	github.com/klauspost/compress v1.15.9 // indirect
	github.com/pierrec/lz4/v4 v4.1.15 // indirect
	github.com/segmentio/kafka-go v0.4.49 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
)
