package database

import (
	"context"
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/secrets/types"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

const dataKeysTable = "data_keys"

var logger = log.New("secrets-store")

type SecretsStoreImpl struct {
	sqlStore *sqlstore.SQLStore
}

func ProvideSecretsStore(sqlStore *sqlstore.SQLStore) *SecretsStoreImpl {
	return &SecretsStoreImpl{
		sqlStore: sqlStore,
	}
}

func (ss *SecretsStoreImpl) GetDataKey(ctx context.Context, name string) (*types.DataKey, error) {
	dataKey := &types.DataKey{}
	var exists bool

	err := ss.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		ex, err := sess.Table(dataKeysTable).
			Where("name = ? AND active = ?", name, ss.sqlStore.Dialect.BooleanStr(true)).
			Get(dataKey)
		exists = ex
		return err
	})

	if !exists {
		return nil, types.ErrDataKeyNotFound
	}

	if err != nil {
		logger.Error("Failed getting data key", "err", err, "name", name)
		return nil, fmt.Errorf("failed getting data key: %w", err)
	}

	return dataKey, nil
}

func (ss *SecretsStoreImpl) GetAllDataKeys(ctx context.Context) ([]*types.DataKey, error) {
	result := make([]*types.DataKey, 0)
	err := ss.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		err := sess.Table(dataKeysTable).Find(&result)
		return err
	})
	return result, err
}

func (ss *SecretsStoreImpl) CreateDataKey(ctx context.Context, dataKey types.DataKey) error {
	if !dataKey.Active {
		return fmt.Errorf("cannot insert deactivated data keys")
	}

	dataKey.Created = time.Now()
	dataKey.Updated = dataKey.Created

	err := ss.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.Table(dataKeysTable).Insert(&dataKey)
		return err
	})

	return err
}

func (ss *SecretsStoreImpl) CreateDataKeyWithDBSession(_ context.Context, dataKey types.DataKey, sess *sqlstore.DBSession) error {
	if !dataKey.Active {
		return fmt.Errorf("cannot insert deactivated data keys")
	}

	dataKey.Created = time.Now()
	dataKey.Updated = dataKey.Created

	_, err := sess.Table(dataKeysTable).Insert(&dataKey)
	return err
}

func (ss *SecretsStoreImpl) DeleteDataKey(ctx context.Context, name string) error {
	return ss.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.Table(dataKeysTable).Delete(&types.DataKey{Name: name})

		return err
	})
}
