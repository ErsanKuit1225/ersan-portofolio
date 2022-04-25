echo "Linking backend-core"
cd packages/backend-core
yarn link
cd -

echo "Linking string-templates"
cd packages/string-templates 
yarn link
cd -

if [ -d "../budibase-pro" ]; then
  cd ../budibase-pro
  yarn bootstrap

  cd packages/pro
  echo "Linking pro"
  yarn link

  echo "Linking backend-core to pro"
  yarn link '@budibase/backend-core'

  cd ../../../budibase

  echo "Linking pro to worker"
  cd packages/worker && yarn link '@budibase/pro'
  cd -

  echo "Linking pro to server"
  cd packages/server && yarn link '@budibase/pro'
  cd -
fi

if [ -d "../account-portal" ]; then
  cd ../account-portal/packages/server
  echo "Linking backend-core to account-portal"
  yarn link "@budibase/backend-core"

  echo "Linking string-templates to account-portal"
  yarn link "@budibase/string-templates"

  if [ -d "../../../budibase-pro" ]; then
    echo "Linking pro to account-portal"
    yarn link "@budibase/pro"
  fi

  cd -
fi
