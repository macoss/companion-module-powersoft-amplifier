module.exports = function (self) {
	self.setVariableDefinitions([
		{ variableId: 'connection_status', name: 'Connection Status' },
		{ variableId: 'power_status', name: 'Power Status' },
		{ variableId: 'manufacturer', name: 'Manufacturer' },
		{ variableId: 'family', name: 'Product Family' },
		{ variableId: 'model', name: 'Model' },
		{ variableId: 'serial', name: 'Serial Number' },
		{ variableId: 'last_error', name: 'Last Error' },
	])
}
