import { AzureMonitorQuery, AzureQueryType } from '../types';

export default function createMockQuery(): AzureMonitorQuery {
  return {
    azureLogAnalytics: {
      query:
        '//change this example to create your own time series query\n<table name>                                                              //the table to query (e.g. Usage, Heartbeat, Perf)\n| where $__timeFilter(TimeGenerated)                                      //this is a macro used to show the full chart’s time range, choose the datetime column here\n| summarize count() by <group by column>, bin(TimeGenerated, $__interval) //change “group by column” to a column in your table, such as “Computer”. The $__interval macro is used to auto-select the time grain. Can also use 1h, 5m etc.\n| order by TimeGenerated asc',
      resultFormat: 'time_series',
      workspace: 'e3fe4fde-ad5e-4d60-9974-e2f3562ffdf2',
      resource: 'test-resource',
    },

    azureResourceGraph: {
      query: 'Resources | summarize count()',
      resultFormat: 'table',
    },

    azureMonitor: {
      // aggOptions: [],
      resourceUri:
        '/subscriptions/99999999-cccc-bbbb-aaaa-9106972f9572/resourceGroups/grafanastaging/providers/Microsoft.Compute/virtualMachines/grafana',
      aggregation: 'Average',
      allowedTimeGrainsMs: [60000, 300000, 900000, 1800000, 3600000, 21600000, 43200000, 86400000],
      // dimensionFilter: '*',
      dimensionFilters: [],
      metricDefinition: 'Microsoft.Compute/virtualMachines',
      metricName: 'Metric A',
      metricNamespace: 'Microsoft.Compute/virtualMachines',
      resourceGroup: 'grafanastaging',
      resourceName: 'grafana',
      timeGrain: 'auto',
      alias: '',
      // timeGrains: [],
      top: '10',
    },

    queryType: AzureQueryType.AzureMonitor,
    refId: 'A',
    subscription: '99999999-cccc-bbbb-aaaa-9106972f9572',
    subscriptions: ['99999999-cccc-bbbb-aaaa-9106972f9572'],
    datasource: {
      type: 'grafana-azure-monitor-datasource',
      uid: 'AAAAA11111BBBBB22222CCCC',
    },
  };
}
