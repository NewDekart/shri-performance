function quantile(arr, q) {
	const sorted = arr.sort((a, b) => a - b);
	const pos = (sorted.length - 1) * q;
	const base = Math.floor(pos);
	const rest = pos - base;

	if (sorted[base + 1] !== undefined) {
		return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
	} else {
		return Math.floor(sorted[base]);
	}
};

function prepareData(result) {
	return result.data.map(item => {
		item.date = item.timestamp.split('T')[0];

		return item;
	});
}

// TODO: реализовать
// показать значение метрики за несколько день
function showMetricByPeriod(data, page, name, startDate, endDate) {
	try {
		const startTimestamp = new Date(startDate).getTime()
		const endTimeStamp = new Date(endDate).getTime()

		const sampleData = data
			.filter(item => item.page == page
				&& item.name == name
				&& new Date(item.timestamp).getTime() > startTimestamp
				&& new Date(item.timestamp).getTime() < endTimeStamp
			)
			.map(item => item.value)

		let result = {};
		result.hits = sampleData.length;
		result.p25 = quantile(sampleData, 0.25);
		result.p50 = quantile(sampleData, 0.5);
		result.p75 = quantile(sampleData, 0.75);
		result.p95 = quantile(sampleData, 0.95);

		let table = {}
		table[name] = result

		console.log(`Metric for ${name} from ${startDate} to ${endDate}:`)
		console.table(table)
	} catch (e) {
		console.error(e)
	}
}

// показать сессию пользователя
function showSession(data, sessionId) {
	try {
		let sampleData = data
			.filter(item => item.requestId == sessionId)

			console.log(`Metrics for sessionId = ${sessionId}:`)
		calcMetrics(sampleData)
	} catch (e) {
		console.error(e)
	}
}

// сравнить метрику в разных срезах
function compareMetric(data, page, name, paramName, paramValues) {
	try {
		let sampleData = data
			.filter(item => item.page == page && item.name == name)

		let table = {}

		const values = paramValues || getAdditionalValuesForParamByName(data, page, name, paramName)

		values.forEach(value => {
			table[value] = getMetricByAdditionalParamValue(sampleData, page, paramName, value)
		})

		console.log(`Compare metric ${name} by ${paramName} for "${paramValues ? values.join(', ') : 'all possible values'}":`)
		console.table(table)
	} catch (e) {
		console.error(e)
	}
}

// любые другие сценарии, которые считаете полезными

// получить метрику по имени доп. параметра и его значению без учета даты
function getMetricByAdditionalParamValue(data, page, name, value) {
	try {
		let sampleData = data
			.filter(item => item.page == page && item.additional[name] == value)
			.map(item => item.value)

		let result = {};

		result.hits = sampleData.length;
		result.p25 = quantile(sampleData, 0.25);
		result.p50 = quantile(sampleData, 0.5);
		result.p75 = quantile(sampleData, 0.75);
		result.p95 = quantile(sampleData, 0.95);

		return result;
	} catch (e) {
		console.error(e);
	}
}

// получить все возможные значение дополнительного параметра для метрики
function getAdditionalValuesForParamByName(data, page, metricName, paramName) {
	try {
		let sampleData = data
			.filter(item => item.page == page && item.name == metricName)
			.map(item => item.additional[paramName])
			.filter(item => Boolean(item))

		return new Set(sampleData)
	} catch(e) {
		console.error(e);
	}
}

// показать всю метрику
function getMetricByName(data, name) {
	let sampleData = data
		.filter(item => item.name == name)
		.map(item => item.value)

	let result = {};

	result.hits = sampleData.length;
	result.p25 = quantile(sampleData, 0.25);
	result.p50 = quantile(sampleData, 0.5);
	result.p75 = quantile(sampleData, 0.75);
	result.p95 = quantile(sampleData, 0.95);

	return result;
}

// вывод всех метрик
function calcMetrics(data) {
	let table = {};
	table.connect = getMetricByName(data, 'connect');
	table.ttfb = getMetricByName(data, 'ttfb');
	table.domLoading = getMetricByName(data, 'domLoading');
	table.response = getMetricByName(data, 'response');
	table.helloDecoration = getMetricByName(data, 'helloDecoration');
	table.generateInputs = getMetricByName(data, 'generateInputs');
	table.drawInputs = getMetricByName(data, 'drawInputs');

	console.table(table);
}

// Пример
// добавить метрику за выбранный день
function addMetricByDate(data, page, name, date) {
	let sampleData = data
		.filter(item => item.page == page && item.name == name && item.date == date)
		.map(item => item.value);

	let result = {};

	result.hits = sampleData.length;
	result.p25 = quantile(sampleData, 0.25);
	result.p50 = quantile(sampleData, 0.5);
	result.p75 = quantile(sampleData, 0.75);
	result.p95 = quantile(sampleData, 0.95);

	return result;
}

// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
	console.log(`All metrics for ${date}:`);

	let table = {};
	table.connect = addMetricByDate(data, page, 'connect', date);
	table.ttfb = addMetricByDate(data, page, 'ttfb', date);
	table.domLoading = getMetricByName(data, 'domLoading');
	table.response = getMetricByName(data, 'response');
	table.helloDecoration = addMetricByDate(data, page, 'helloDecoration', date);
	table.generateInputs = addMetricByDate(data, page, 'generateInputs', date);
	table.drawInputs = addMetricByDate(data, page, 'drawInputs', date);

	console.table(table);
};

fetch('https://shri.yandex/hw/stat/data?counterId=99999999-9999-9999-9999-000000000000')
	.then(res => res.json())
	.then(result => {
		let data = prepareData(result);

		calcMetricsByDate(data, 'dekart416-shri-perfomance', '2021-10-30');
		// добавить свои сценарии, реализовать функции выше
		showMetricByPeriod(data, 'dekart416-shri-perfomance', 'helloDecoration', '2021-10-29', '2021-10-31')
		compareMetric(data, 'dekart416-shri-perfomance', 'drawInputs', 'platform', ['Windows', 'Android'])
		compareMetric(data, 'dekart416-shri-perfomance', 'drawInputs', 'browser')
		compareMetric(data, 'dekart416-shri-perfomance', 'ttfb', 'browser')
		showSession(data, '899811378134')
	});
